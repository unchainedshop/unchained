import { Collection, Filter } from '@unchainedshop/types/common';
import { FiltersModule, FilterText } from '@unchainedshop/types/filters';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import { findLocalizedText, generateDbFilterById, generateDbObjectId } from 'meteor/unchained:utils';

const FILTER_TEXT_EVENTS = ['FILTER_UPDATE_TEXTS'];

export const configureFilterTextsModule = ({
  FilterTexts,
}: {
  FilterTexts: Collection<FilterText>;
}): FiltersModule['texts'] => {
  registerEvents(FILTER_TEXT_EVENTS);

  const upsertLocalizedText: FiltersModule['texts']['upsertLocalizedText'] = async (
    params,
    locale,
    text,
    userId,
  ) => {
    const { filterId, filterOptionValue } = params;

    const modifier: any = {
      $set: {
        updated: new Date(),
        updatedBy: userId,
        title: text.title,
        subtitle: text.subtitle,
        authorId: userId,
      },
      $setOnInsert: {
        _id: generateDbObjectId(),
        created: new Date(),
        createdBy: userId,
        filterId,
        filterOptionValue: filterOptionValue || null,
        locale,
      },
    };

    const selector: Filter<FilterText> = {
      filterId,
      filterOptionValue: filterOptionValue || { $eq: null },
      locale,
    };

    const updateResult = await FilterTexts.updateOne(selector, modifier, {
      upsert: true,
    });

    return FilterTexts.findOne(
      updateResult.upsertedId ? (generateDbFilterById(updateResult.upsertedId) as any) : selector,
      {},
    );
  };

  return {
    // Queries
    findTexts: async (selector, options) => {
      const texts = FilterTexts.find(selector, options);
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
        parsedLocale,
      );

      return text;
    },

    // Mutations
    updateTexts: async (params, texts, userId) => {
      const filterTexts = await Promise.all(
        texts.map(({ locale, ...text }) => upsertLocalizedText(params, locale, text, userId)),
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
