import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { OrderPosition } from '@unchainedshop/core-orders';

export const OrderPositionsCollection = async (db: mongodb.Db) => {
  const OrderPositions = db.collection<OrderPosition>('order_positions');

  // Order Indexes
  await buildDbIndexes<OrderPosition>(OrderPositions, [
    { index: { productId: 1 } },
    { index: { orderId: 1 } },
  ]);

  return OrderPositions;
};
