import type { UnchainedCore } from '@unchainedshop/core';
import DataLoader from 'dataloader';
import type { ProductMediaText } from '@unchainedshop/core-products';
import buildLocaleMap from './buildLocaleMap.ts';
import buildTextMap from './buildTextMap.ts';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productMediaId: string; locale: Intl.Locale }, ProductMediaText>(async (queries) => {
    const productMediaIds = [...new Set(queries.map((q) => q.productMediaId).filter(Boolean))];

    const texts = await unchainedAPI.modules.products.media.texts.findMediaTexts({
      productMediaIds,
    });

    const localeMap = buildLocaleMap(queries, texts);
    const textsMap = buildTextMap(localeMap, texts, (text) => text.productMediaId);

    return queries.map((q) => textsMap[q.locale + q.productMediaId]);
  });
