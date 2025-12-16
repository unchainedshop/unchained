import type { UnchainedCore } from '@unchainedshop/core';
import type { Product } from '@unchainedshop/core-products';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productId: string }, Product>(async (queries) => {
    const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

    const products = await unchainedAPI.modules.products.findProducts({
      productIds,
      includeDeleted: true,
    });

    const productMap = {};
    for (const product of products) {
      productMap[product._id] = product;
    }

    return queries.map((q) => productMap[q.productId]);
  });
