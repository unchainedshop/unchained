import { Db } from '@unchainedshop/types/common';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const OrderDeliveriesCollection = async (db: Db) => {
  const OrderDeliveries = db.collection<OrderDelivery>('order_deliveries');

  // Order Indexes
  await buildDbIndexes<OrderDelivery>(OrderDeliveries, [
    { index: { orderId: 1 } },
  ]);

  return OrderDeliveries;
};
