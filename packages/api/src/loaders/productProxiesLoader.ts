import type { UnchainedCore } from '@unchainedshop/core';
import type { Product } from '@unchainedshop/core-products';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productId: string }, Product[]>(async (queries) => {
    const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

    const productProxies = await unchainedAPI.modules.products.findProducts({
      includeDrafts: true,
      bundleItemProductIds: productIds,
      proxyAssignmentProductIds: productIds,
    });

    const productProxyMap = {};
    for (const productProxy of productProxies) {
      const bundleItemIds = productProxy.bundleItems?.map((item) => item.productId) || [];
      const proxyAssignmentIds =
        productProxy.proxy?.assignments?.map((assignment) => assignment.productId) || [];

      for (const productId of [...bundleItemIds, ...proxyAssignmentIds]) {
        if (!productProxyMap[productId]) {
          productProxyMap[productId] = [];
        }
        productProxyMap[productId].push(productProxy);
      }
    }
    return queries.map((q) => productProxyMap[q.productId] || []);
  });
