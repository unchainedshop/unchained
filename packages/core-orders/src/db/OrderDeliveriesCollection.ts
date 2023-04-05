import { Db } from '@unchainedshop/types/common.js';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries.js';
import { buildDbIndexes } from '@unchainedshop/mongodb';

export const OrderDeliveriesCollection = async (db: Db) => {
  const OrderDeliveries = db.collection<OrderDelivery>('order_deliveries');

  // Order Indexes
  await buildDbIndexes<OrderDelivery>(OrderDeliveries, [{ index: { orderId: 1 } }]);

  return OrderDeliveries;
};
