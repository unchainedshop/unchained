import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries.js';

export const OrderDeliveriesCollection = async (db: mongodb.Db) => {
  const OrderDeliveries = db.collection<OrderDelivery>('order_deliveries');

  // Order Indexes
  await buildDbIndexes<OrderDelivery>(OrderDeliveries, [{ index: { orderId: 1 } }]);

  return OrderDeliveries;
};
