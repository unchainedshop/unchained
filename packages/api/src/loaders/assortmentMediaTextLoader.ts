import { UnchainedCore } from '@unchainedshop/core';
import { AssortmentMediaText } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';
import buildTextMap from './buildTextMap.js';
import buildLocaleMap from './buildLocaleMap.js';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ assortmentMediaId: string; locale: Intl.Locale }, AssortmentMediaText>(
    async (queries) => {
      const assortmentMediaIds = [...new Set(queries.map((q) => q.assortmentMediaId).filter(Boolean))];

      const texts = await unchainedAPI.modules.assortments.media.texts.findMediaTexts(
        { assortmentMediaId: { $in: assortmentMediaIds } },
        {
          sort: {
            assortmentMediaId: 1,
          },
        },
      );

      const localeMap = buildLocaleMap(queries, texts);
      const textsMap = buildTextMap(localeMap, texts, (text) => text.assortmentMediaId);

      return queries.map((q) => textsMap[q.locale + q.assortmentMediaId]);
    },
  );
