import { UnchainedCore } from '@unchainedshop/core';
import DataLoader from 'dataloader';
import { buildLocaleMap } from './utils.js';
import { ProductMediaText } from '@unchainedshop/core-products';
import buildTextMap from './buildTextMap.js';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productMediaId: string; locale: string }, ProductMediaText>(async (queries) => {
    const productMediaIds = [...new Set(queries.map((q) => q.productMediaId).filter(Boolean))];

    const texts = await unchainedAPI.modules.products.media.texts.findMediaTexts(
      { productMediaId: { $in: productMediaIds } },
      {
        sort: {
          productMediaId: 1,
        },
      },
    );

    const localeMap = buildLocaleMap(queries, texts);
    const textsMap = buildTextMap(localeMap, texts, (text) => text.productMediaId);

    return queries.map((q) => textsMap[q.locale + q.productMediaId]);
  });
