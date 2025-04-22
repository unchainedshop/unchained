import { UnchainedCore } from '@unchainedshop/core';
import DataLoader from 'dataloader';
import { buildLocaleMap } from './utils.js';
import { FilterText } from '@unchainedshop/core-filters';

export default async (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ filterId: string; filterOptionValue?: string; locale: string }, FilterText>(
    async (queries) => {
      const filterIds = [...new Set(queries.map((q) => q.filterId).filter(Boolean))];

      const texts = await unchainedAPI.modules.filters.texts.findTexts(
        { filterId: { $in: filterIds } },
        {
          sort: {
            filterId: 1,
          },
        },
      );

      const localeMap = buildLocaleMap(queries, texts);

      const textsMap = {};
      for (const text of texts) {
        const localesForText = localeMap[text.locale] || [];
        for (const locale of localesForText) {
          textsMap[locale + text.filterId + text.filterOptionValue] = text;
        }
      }
      return queries.map((q) => textsMap[q.locale + q.filterId + q.filterOptionValue]);
    },
  );
