import type { UnchainedCore } from '@unchainedshop/core';
import DataLoader from 'dataloader';
import buildLocaleMap from './buildLocaleMap.ts';
import type { FilterText } from '@unchainedshop/core-filters';
import buildTextMap from './buildTextMap.ts';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<
    { filterId: string; filterOptionValue?: string | null; locale: Intl.Locale },
    FilterText
  >(async (queries) => {
    const filterIds = [...new Set(queries.map((q) => q.filterId).filter(Boolean))];

    const texts = await unchainedAPI.modules.filters.texts.findTexts(
      { filterIds },
      {
        sort: {
          filterId: 1,
        },
      },
    );

    const localeMap = buildLocaleMap(queries, texts);
    const textsMap = buildTextMap(localeMap, texts, (text) => text.filterId + text.filterOptionValue);

    return queries.map((q) => textsMap[q.locale + q.filterId + q.filterOptionValue]);
  });
