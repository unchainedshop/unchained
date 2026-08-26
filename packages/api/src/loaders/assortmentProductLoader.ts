import type { UnchainedCore } from '@unchainedshop/core';
import type { AssortmentProduct } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ assortmentId: string; productId: string }, AssortmentProduct>(async (queries) => {
    const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];
    const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

    const assortmentProducts = await unchainedAPI.modules.assortments.products.findAssortmentProducts({
      assortmentIds,
      productIds,
    });

    const assortmentProductMap = new Map<string, Map<string, AssortmentProduct>>();
    for (const assortmentProduct of assortmentProducts) {
      const productsById = assortmentProductMap.get(assortmentProduct.assortmentId) || new Map();
      productsById.set(assortmentProduct.productId, assortmentProduct);
      assortmentProductMap.set(assortmentProduct.assortmentId, productsById);
    }
    return queries.map(
      (q) => assortmentProductMap.get(q.assortmentId)?.get(q.productId) as AssortmentProduct,
    );
  });
