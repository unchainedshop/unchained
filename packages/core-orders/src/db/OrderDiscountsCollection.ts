import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { OrderDiscount } from '@unchainedshop/core-orders';

export const OrderDiscountsCollection = async (db: mongodb.Db) => {
  const OrderDiscounts = db.collection<OrderDiscount>('order_discounts');

  // Order Indexes
  await buildDbIndexes<OrderDiscount>(OrderDiscounts, [
    { index: { orderId: 1 } },
    { index: { trigger: 1 } },
  ]);

  return OrderDiscounts;
};
