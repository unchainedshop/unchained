import { Db } from '@unchainedshop/types/common.js';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts.js';
import { buildDbIndexes } from '@unchainedshop/mongodb';

export const OrderDiscountsCollection = async (db: Db) => {
  const OrderDiscounts = db.collection<OrderDiscount>('order_discounts');

  // Order Indexes
  await buildDbIndexes<OrderDiscount>(OrderDiscounts, [
    { index: { orderId: 1 } },
    { index: { trigger: 1 } },
  ]);

  return OrderDiscounts;
};
