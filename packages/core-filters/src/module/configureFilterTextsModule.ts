import { emit, registerEvents } from '@unchainedshop/events';
import { findLocalizedText, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { FilterText } from '../db/FiltersCollection.js';

const FILTER_TEXT_EVENTS = ['FILTER_UPDATE_TEXT'];

export const configureFilterTextsModule = ({
  FilterTexts,
}: {
  FilterTexts: mongodb.Collection<FilterText>;
}) => {
  registerEvents(FILTER_TEXT_EVENTS);

  const upsertLocalizedText = async (
    params: { filterId: string; filterOptionValue?: string },
    locale: string,
    text: Omit<FilterText, 'filterId' | 'filterOptionValue' | 'locale'>,
  ): Promise<FilterText> => {
    const { filterId, filterOptionValue } = params;

    const modifier: any = {
      $set: {
        updated: new Date(),
        title: text.title,
        subtitle: text.subtitle,
      },
      $setOnInsert: {
        _id: generateDbObjectId(),
        created: new Date(),
        filterId,
        filterOptionValue: filterOptionValue || null,
        locale,
      },
    };

    const selector: mongodb.Filter<FilterText> = {
      filterId,
      filterOptionValue: filterOptionValue || { $eq: null },
      locale,
    };

    const updateResult = await FilterTexts.findOneAndUpdate(selector, modifier, {
      upsert: true,
      returnDocument: 'after',
      includeResultMetadata: true,
    });

    if (updateResult.ok) {
      await emit('FILTER_UPDATE_TEXT', {
        filterId: params.filterId,
        filterOptionValue: params.filterOptionValue || null,
        text: updateResult.value,
      });
    }
    return updateResult.value;
  };

  return {
    // Queries
    findTexts: async (
      selector: mongodb.Filter<FilterText>,
      options?: mongodb.FindOptions,
    ): Promise<Array<FilterText>> => {
      const texts = FilterTexts.find(selector, options);
      return texts.toArray();
    },

    findLocalizedText: async ({
      filterId,
      filterOptionValue,
      locale,
    }: {
      filterId: string;
      filterOptionValue?: string;
      locale: string;
    }): Promise<FilterText> => {
      const parsedLocale = new Intl.Locale(locale);

      const text = await findLocalizedText(
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
    updateTexts: async (
      params: { filterId: string; filterOptionValue?: string },
      texts: Array<Omit<FilterText, 'filterId' | 'filterOptionValue'>>,
    ): Promise<Array<FilterText>> => {
      const filterTexts = await Promise.all(
        texts.map(async ({ locale, ...text }) => upsertLocalizedText(params, locale, text)),
      );

      return filterTexts;
    },

    deleteMany: async ({
      filterId,
      excludedFilterIds,
    }: {
      filterId?: string;
      excludedFilterIds?: string[];
    }): Promise<number> => {
      const selector: mongodb.Filter<FilterText> = {};
      if (filterId) {
        selector.filterId = filterId;
      } else if (excludedFilterIds) {
        selector.filterId = { $nin: excludedFilterIds };
      }
      const deletedResult = await FilterTexts.deleteMany(selector);
      return deletedResult.deletedCount;
    },
  };
};
