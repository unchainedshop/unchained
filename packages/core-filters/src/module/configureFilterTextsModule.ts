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
    locale: Intl.Locale,
    text: Omit<FilterText, 'filterId' | 'filterOptionValue' | 'locale'>,
  ): Promise<FilterText> => {
    const { filterId, filterOptionValue } = params;

    const updateResult = await FilterTexts.findOneAndUpdate(
      {
        filterId,
        filterOptionValue: filterOptionValue || { $eq: null },
        locale: locale.baseName,
      },
      {
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
          locale: locale.baseName,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        includeResultMetadata: true,
      },
    );

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
    ): Promise<FilterText[]> => {
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
      locale: Intl.Locale;
    }): Promise<FilterText> => {
      const text = await findLocalizedText(
        FilterTexts,
        {
          filterId,
          filterOptionValue: filterOptionValue || { $eq: null },
        },
        locale,
      );

      return text;
    },

    // Mutations
    updateTexts: async (
      params: { filterId: string; filterOptionValue?: string },
      texts: Omit<FilterText, 'filterId' | 'filterOptionValue'>[],
    ): Promise<FilterText[]> => {
      const filterTexts = await Promise.all(
        texts.map(async ({ locale, ...text }) =>
          upsertLocalizedText(params, new Intl.Locale(locale), text),
        ),
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
