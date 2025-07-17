import { UnchainedCore } from '@unchainedshop/core';
import { Product } from '@unchainedshop/core-products';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ productId?: string }, Product[]>(async (queries) => {
    const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

    const productProxies = await unchainedAPI.modules.products.findProducts({
      includeDrafts: true,
      productSelector: {
        $or: [
          {
            'bundleItems.productId': { $in: productIds },
          },
          {
            'proxy.assignments.productId': { $in: productIds },
          },
        ],
      },
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
