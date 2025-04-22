import { UnchainedCore } from '@unchainedshop/core';
import { AssortmentProduct } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';

export default async (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ assortmentId: string; productId: string }, AssortmentProduct>(async (queries) => {
    const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

    const assortmentProducts = await unchainedAPI.modules.assortments.products.findAssortmentProducts({
      assortmentIds,
    });

    const assortmentProductMap = {};
    for (const assortmentProduct of assortmentProducts) {
      assortmentProductMap[assortmentProduct.assortmentId + assortmentProduct.productId] =
        assortmentProduct;
    }
    return queries.map((q) => assortmentProductMap[q.assortmentId + q.productId]);
  });
