import type { UnchainedCore } from '@unchainedshop/core';
import type { AssortmentProduct } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productId: string }, AssortmentProduct[]>(async (queries) => {
    const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

    const assortmentProducts = await unchainedAPI.modules.assortments.products.findAssortmentProducts({
      productIds,
    });

    const assortmentProductsMap = {};
    for (const assortmentProduct of assortmentProducts) {
      if (!assortmentProductsMap[assortmentProduct.productId]) {
        assortmentProductsMap[assortmentProduct.productId] = [assortmentProduct];
      } else {
        assortmentProductsMap[assortmentProduct.productId].push(assortmentProduct);
      }
    }
    return queries.map((q) => assortmentProductsMap[q.productId] || []);
  });
