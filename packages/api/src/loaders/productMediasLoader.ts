import { UnchainedCore } from '@unchainedshop/core';
import { ProductMedia } from '@unchainedshop/core-products';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productId?: string }, ProductMedia[]>(async (queries) => {
    const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];
    const productMediaItems = await unchainedAPI.modules.products.media.findProductMedias({
      productId: { $in: productIds },
    });

    const productMediaMap = {};
    for (const productMedia of productMediaItems) {
      if (!productMediaMap[productMedia.productId]) {
        productMediaMap[productMedia.productId] = [productMedia];
      } else {
        productMediaMap[productMedia.productId].push(productMedia);
      }
    }
    return queries.map((q) => productMediaMap[q.productId] || []);
  });
