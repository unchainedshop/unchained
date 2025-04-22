import { UnchainedCore } from '@unchainedshop/core';
import DataLoader from 'dataloader';
import { buildLocaleMap } from './utils.js';
import { ProductText } from '@unchainedshop/core-products';

export default async (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productId: string; locale: string }, ProductText>(async (queries) => {
    const productIds = [...new Set(queries.map((q) => q.productId))].filter(Boolean);
    const texts = await unchainedAPI.modules.products.texts.findTexts(
      { productId: { $in: productIds } },
      {
        sort: {
          productId: 1,
        },
      },
    );
    const localeMap = buildLocaleMap(queries, texts);

    const textsMap = {};
    for (const text of texts) {
      const localesForText = localeMap[text.locale] || [];
      for (const locale of localesForText) {
        textsMap[locale + text.productId] = text;
      }
    }
    return queries.map((q) => textsMap[q.locale + q.productId]);
  });
