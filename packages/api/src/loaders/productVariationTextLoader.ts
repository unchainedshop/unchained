import type { UnchainedCore } from '@unchainedshop/core';
import DataLoader from 'dataloader';
import type { ProductVariationText } from '@unchainedshop/core-products';
import buildTextMap from './buildTextMap.ts';
import buildLocaleMap from './buildLocaleMap.ts';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<
    { productVariationId: string; productVariationOptionValue?: string; locale: Intl.Locale },
    ProductVariationText
  >(async (queries) => {
    const productVariationIds = [...new Set(queries.map((q) => q.productVariationId).filter(Boolean))];

    const texts = await unchainedAPI.modules.products.variations.texts.findVariationTexts(
      {
        productVariationId: { $in: productVariationIds },
      },
      {
        sort: {
          productVariationId: 1,
        },
      },
    );

    const localeMap = buildLocaleMap(queries, texts);

    // Build a map with composite key: locale + productVariationId + productVariationOptionValue
    const textsMap = buildTextMap(localeMap, texts, (text) => {
      const optionValue = text.productVariationOptionValue || '';
      return text.productVariationId + optionValue;
    });

    return queries.map((q) => {
      const optionValue = q.productVariationOptionValue || '';
      return textsMap[q.locale + q.productVariationId + optionValue];
    });
  });
