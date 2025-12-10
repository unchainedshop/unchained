import type { UnchainedCore } from '@unchainedshop/core';
import type { ProductVariation } from '@unchainedshop/core-products';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productId: string; key: string }, ProductVariation | null>(async (queries) => {
    const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

    const variations = await unchainedAPI.modules.products.variations.findProductVariations({
      productId: { $in: productIds },
    });

    // Create a map with composite key: productId:key
    const variationMap: Record<string, ProductVariation> = {};
    for (const variation of variations) {
      variationMap[`${variation.productId}:${variation.key}`] = variation;
    }

    return queries.map((q) => variationMap[`${q.productId}:${q.key}`] || null);
  });
