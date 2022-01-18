import { Collection } from '@unchainedshop/types/common';
import {
  Filter,
  FiltersModule,
  FilterText,
} from '@unchainedshop/types/filters';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbObjectId,
} from 'meteor/unchained:utils';

const FILTER_TEXT_EVENTS = ['FILTER_UPDATE_TEXTS'];

export const configureFilterTextsModule = ({
  Filters,
  FilterTexts,
}: {
  Filters: Collection<Filter>;
  FilterTexts: Collection<FilterText>;
}): FiltersModule['texts'] => {
  registerEvents(FILTER_TEXT_EVENTS);

  const upsertLocalizedText = async (
    params: { filterId: string; filterOptionValue?: string },
    locale: string,
    text: FilterText,
    userId?: string
  ) => {
    const { filterId, filterOptionValue } = params;

    const _id = generateDbObjectId();
    const modifier: any = {
      $set: {
        updated: new Date(),
        updatedBy: userId,
        title: text.title,
        subtitle: text.subtitle,
      },
      $setOnInsert: {
        _id,
        created: new Date(),
        createdBy: userId,
        filterId,
        filterOptionValue: filterOptionValue || null,
        locale,
      },
    };

    const selector = {
      filterId,
      filterOptionValue: filterOptionValue || { $eq: null },
      locale,
    };

    const updateResult = await FilterTexts.updateOne(selector, modifier, {
      upsert: true,
    });

    return await FilterTexts.findOne(
      updateResult.upsertedCount === 1 ? generateDbFilterById(_id) : selector
    );
  };

  return {
    // Queries
    findTexts: async ({ filterId, filterOptionValue }) => {
      const texts = FilterTexts.find({
        filterId,
        filterOptionValue: filterOptionValue || { $eq: null },
      });

      return texts.toArray();
    },

    findLocalizedText: async ({ filterId, filterOptionValue, locale }) => {
      const parsedLocale = new Locale(locale);

      const text = await findLocalizedText<FilterText>(
        FilterTexts,
        {
          filterId,
          filterOptionValue: filterOptionValue || { $eq: null },
        },
        parsedLocale
      );

      return text;
    },

    // Mutations
    updateTexts: async (params, texts = [], userId) => {
      const filterTexts = await Promise.all(
        texts.map((text) =>
          upsertLocalizedText(
            params,
            text.locale,
            {
              ...text,
              ...params,
              authorId: userId,
            },
            userId
          )
        )
      );

      emit('FILTER_UPDATE_TEXTS', {
        filterId: params.filterId,
        filterOptionValue: params.filterOptionValue || null,
        filterTexts,
      });

      return filterTexts;
    },

    upsertLocalizedText,

    deleteMany: async (filterId) => {
      const deletedResult = await FilterTexts.deleteMany({ filterId });

      return deletedResult.deletedCount;
    },
  };
};
