import type { Order, OrderDelivery } from '@unchainedshop/core-orders';

/**
 * Resolve the order delivery a supply goes with: the order delivery being priced, else the
 * current delivery of the order. A delivery or payment price simulated for an order has no
 * order delivery of its own, but its goods still go to the order's delivery address.
 */
export default async function resolveOrderDelivery({
  orderDelivery,
  order,
  modules,
}: {
  orderDelivery?: OrderDelivery | null;
  order?: Order | null;
  modules: {
    orders: {
      deliveries: {
        findDelivery: (params: { orderDeliveryId: string }) => Promise<OrderDelivery | null>;
      };
    };
  };
}): Promise<OrderDelivery | null> {
  if (orderDelivery) return orderDelivery;
  if (!order?.deliveryId) return null;
  return modules.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId });
}
