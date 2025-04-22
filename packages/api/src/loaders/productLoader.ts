import { UnchainedCore } from '@unchainedshop/core';
import { Product } from '@unchainedshop/core-products';
import DataLoader from 'dataloader';

export default async (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productId: string }, Product>(async (queries) => {
    const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))]; // you don't need lodash, _.unique my ass

    const products = await unchainedAPI.modules.products.findProducts({
      productIds,
      productSelector: {
        status: { $exists: true },
      },
    });

    const productMap = {};
    for (const product of products) {
      productMap[product._id] = product;
    }

    return queries.map((q) => productMap[q.productId]);
  });
