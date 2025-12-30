import type { UnchainedCore } from '@unchainedshop/core';
import DataLoader from 'dataloader';
import type { ProductText } from '@unchainedshop/core-products';
import buildTextMap from './buildTextMap.ts';
import buildLocaleMap from './buildLocaleMap.ts';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productId: string; locale: Intl.Locale }, ProductText>(async (queries) => {
    const productIds = [...new Set(queries.map((q) => q.productId))].filter(Boolean);
    const texts = await unchainedAPI.modules.products.texts.findTexts({ productIds });
    const localeMap = buildLocaleMap(queries, texts);
    const textsMap = buildTextMap(localeMap, texts, (text) => text.productId);

    return queries.map((q) => textsMap[q.locale + q.productId]);
  });
