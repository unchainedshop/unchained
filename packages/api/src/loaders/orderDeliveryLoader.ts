import type { UnchainedCore } from '@unchainedshop/core';
import type { OrderDelivery } from '@unchainedshop/core-orders';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ orderDeliveryId: string }, OrderDelivery | null>(async (queries) => {
    const orderDeliveryIds = [...new Set(queries.map((q) => q.orderDeliveryId).filter(Boolean))];

    const deliveries = await unchainedAPI.modules.orders.deliveries.findDeliveries({
      orderDeliveryIds,
    });

    const deliveryMap: Record<string, OrderDelivery> = {};
    for (const delivery of deliveries) {
      deliveryMap[delivery._id] = delivery;
    }

    return queries.map((q) => deliveryMap[q.orderDeliveryId] ?? null);
  });
