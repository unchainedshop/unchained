import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';
import { Order } from '@unchainedshop/types/orders';
import { OrderPosition } from '@unchainedshop/types/orders.positions';

export const OrderPositionsCollection = async (db: Db) => {
  const OrderPositions = db.collection<OrderPosition>('order_positions');

  // Order Indexes
  await buildDbIndexes<OrderPosition>(OrderPositions, [
    { index: { productId: 1 } },
    { index: { orderId: 1 } },
  ]);

  return OrderPositions;
};
