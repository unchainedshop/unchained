import { Db } from '@unchainedshop/types/common';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts';
import { buildDbIndexes } from '@unchainedshop/utils';

export const OrderDiscountsCollection = async (db: Db) => {
  const OrderDiscounts = db.collection<OrderDiscount>('order_discounts');

  // Order Indexes
  await buildDbIndexes<OrderDiscount>(OrderDiscounts, [
    { index: { orderId: 1 } },
    { index: { trigger: 1 } },
  ]);

  return OrderDiscounts;
};
