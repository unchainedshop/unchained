import { emit, registerEvents } from '@unchainedshop/events';
import { findLocalizedText, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import type { FilterText } from '../db/FiltersCollection.ts';

const FILTER_TEXT_EVENTS = ['FILTER_UPDATE_TEXT'];

export const configureFilterTextsModule = ({
  FilterTexts,
}: {
  FilterTexts: mongodb.Collection<FilterText>;
}) => {
  registerEvents(FILTER_TEXT_EVENTS);

  const upsertLocalizedText = async (
    params: { filterId: string; filterOptionValue?: string | null },
    locale: Intl.Locale,
    text: Omit<Partial<FilterText>, 'filterId' | 'filterOptionValue' | 'locale'>,
  ) => {
    const { filterId, filterOptionValue } = params;

    const filterText = (await FilterTexts.findOneAndUpdate(
      {
        filterId,
        filterOptionValue: filterOptionValue || { $eq: null },
        locale: locale.baseName,
      },
      {
        $set: {
          updated: new Date(),
          ...text,
        },
        $setOnInsert: {
          _id: generateDbObjectId(),
          created: new Date(),
          filterId,
          filterOptionValue,
          locale: locale.baseName,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    )) as FilterText;
    await emit('FILTER_UPDATE_TEXT', {
      filterId: params.filterId,
      filterOptionValue: params.filterOptionValue || null,
      text: filterText,
    });
    return filterText;
  };

  return {
    // Queries
    findTexts: async (
      query: { filterId?: string; filterIds?: string[]; filterOptionValue?: string | null },
      options?: mongodb.FindOptions,
    ): Promise<FilterText[]> => {
      const selector: mongodb.Filter<FilterText> = {};
      if (query.filterId) {
        selector.filterId = query.filterId;
      }
      if (query.filterIds) {
        selector.filterId = { $in: query.filterIds };
      }
      if (query.filterOptionValue !== undefined) {
        selector.filterOptionValue = query.filterOptionValue || { $eq: null };
      }
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
      params: { filterId: string; filterOptionValue?: string | null },
      texts: ({
        locale: FilterText['locale'];
      } & Omit<Partial<FilterText>, 'filterId' | 'filterOptionValue' | 'locale'>)[],
    ) => {
      const filterTexts = (
        await Promise.all(
          texts.map(async ({ locale, ...text }) =>
            upsertLocalizedText(params, new Intl.Locale(locale), text),
          ),
        )
      ).filter(Boolean) as FilterText[];

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
