import { UnchainedCore } from '@unchainedshop/core';
import { AssortmentMediaText } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';
import { buildLocaleMap } from './utils.js';

export default async (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ assortmentMediaId: string; locale: string }, AssortmentMediaText>(async (queries) => {
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

    const textsMap = {};
    for (const text of texts) {
      const localesForText = localeMap[text.locale] || [];
      for (const locale of localesForText) {
        textsMap[locale + text.assortmentMediaId] = text;
      }
    }
    return queries.map((q) => textsMap[q.locale + q.assortmentMediaId]);
  });
