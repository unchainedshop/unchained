import { Db } from '@unchainedshop/types/common.js';
import { OrderPosition } from '@unchainedshop/types/orders.positions.js';
import { buildDbIndexes } from '@unchainedshop/utils';

export const OrderPositionsCollection = async (db: Db) => {
  const OrderPositions = db.collection<OrderPosition>('order_positions');

  // Order Indexes
  await buildDbIndexes<OrderPosition>(OrderPositions, [
    { index: { productId: 1 } },
    { index: { orderId: 1 } },
  ]);

  return OrderPositions;
};
