import { UnchainedCore } from '@unchainedshop/core';
import { AssortmentText } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';
import { buildLocaleMap } from './utils.js';
import buildTextMap from './buildTextMap.js';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ assortmentId: string; locale: string }, AssortmentText>(async (queries) => {
    const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

    const texts = await unchainedAPI.modules.assortments.texts.findTexts(
      { assortmentId: { $in: assortmentIds } },
      {
        sort: {
          assortmentId: 1,
        },
      },
    );

    const localeMap = buildLocaleMap(queries, texts);
    const textsMap = buildTextMap(localeMap, texts, (text) => text.assortmentId);

    return queries.map((q) => textsMap[q.locale + q.assortmentId]);
  });
