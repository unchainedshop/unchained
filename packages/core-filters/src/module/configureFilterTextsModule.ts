import { Collection, Filter } from '@unchainedshop/types/common.js';
import { FiltersModule, FilterText } from '@unchainedshop/types/filters.js';
import localePkg from 'locale';
import { emit, registerEvents } from '@unchainedshop/events';
import { findLocalizedText, generateDbObjectId } from '@unchainedshop/utils';

const { Locale } = localePkg;

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
  ) => {
    const { filterId, filterOptionValue } = params;

    const modifier: any = {
      $set: {
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

    const selector: Filter<FilterText> = {
      filterId,
      filterOptionValue: filterOptionValue || { $eq: null },
      locale,
    };

    const updateResult = await FilterTexts.updateOne(selector, modifier, {
      upsert: true,
    });
    const isModified = updateResult.upsertedCount > 0 || updateResult.modifiedCount > 0;

    const filterTexts = await FilterTexts.findOne(selector, {});
    if (isModified) {
      await FilterTexts.updateOne(selector, {
        $set: {
          updated: new Date(),
        },
      });
      await emit('FILTER_UPDATE_TEXTS', {
        filterId: params.filterId,
        filterOptionValue: params.filterOptionValue || null,
        text: filterTexts,
      });
    }
    return filterTexts;
  };

  return {
    // Queries
    findTexts: async (selector, options) => {
      const texts = FilterTexts.find(selector, options);
      return texts.toArray();
    },

    findLocalizedText: async ({ filterId, filterOptionValue, locale }) => {
      const parsedLocale = new Locale(locale);

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
    updateTexts: async (params, texts) => {
      const filterTexts = await Promise.all(
        texts.map(({ locale, ...text }) => upsertLocalizedText(params, locale, text)),
      );

      return filterTexts;
    },

    upsertLocalizedText,

    deleteMany: async ({ filterId, excludedFilterIds }) => {
      const selector: Filter<FilterText> = {};
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
