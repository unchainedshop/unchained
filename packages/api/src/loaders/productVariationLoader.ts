import type { UnchainedCore } from '@unchainedshop/core';
import type { ProductVariation } from '@unchainedshop/core-products';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productVariationId: string }, ProductVariation | null>(async (queries) => {
    const productVariationIds = [...new Set(queries.map((q) => q.productVariationId).filter(Boolean))];

    const variations = await unchainedAPI.modules.products.variations.findProductVariations({
      productVariationIds,
    });

    const variationMap: Record<string, ProductVariation> = {};
    for (const variation of variations) {
      variationMap[variation._id] = variation;
    }

    return queries.map((q) => variationMap[q.productVariationId] || null);
  });
