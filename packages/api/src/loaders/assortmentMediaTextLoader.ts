import type { UnchainedCore } from '@unchainedshop/core';
import type { AssortmentMediaText } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';
import buildTextMap from './buildTextMap.ts';
import buildLocaleMap from './buildLocaleMap.ts';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ assortmentMediaId: string; locale: Intl.Locale }, AssortmentMediaText>(
    async (queries) => {
      const assortmentMediaIds = [...new Set(queries.map((q) => q.assortmentMediaId).filter(Boolean))];

      const texts = await unchainedAPI.modules.assortments.media.texts.findMediaTexts({
        assortmentMediaIds,
      });

      const localeMap = buildLocaleMap(queries, texts);
      const textsMap = buildTextMap(localeMap, texts, (text) => text.assortmentMediaId);

      return queries.map((q) => textsMap[q.locale + q.assortmentMediaId]);
    },
  );
