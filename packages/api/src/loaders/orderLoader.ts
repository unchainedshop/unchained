import type { UnchainedCore } from '@unchainedshop/core';
import type { Order } from '@unchainedshop/core-orders';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ orderId: string }, Order>(async (queries) => {
    const orderIds = [...new Set(queries.map((q) => q.orderId).filter(Boolean))];

    // It's important to also fetch deleted with the loader,
    // because the loader fetches entities by id.
    const orders = await unchainedAPI.modules.orders.findOrders({
      includeCarts: true,
      orderIds,
    });

    const orderMap = {};
    for (const order of orders) {
      orderMap[order._id] = order;
    }

    return queries.map((q) => orderMap[q.orderId]);
  });
