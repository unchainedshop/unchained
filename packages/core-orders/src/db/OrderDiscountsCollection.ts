import { mongodb, buildDbIndexes, type TimestampFields } from '@unchainedshop/mongodb';
import type { Price } from '@unchainedshop/utils';

export type OrderDiscount = {
  _id: string;
  orderId: string;
  code?: string;
  total?: Price;
  trigger?: OrderDiscountTrigger;
  discountKey: string;
  reservation?: any;
  context?: any;
} & TimestampFields;

export const OrderDiscountsCollection = async (db: mongodb.Db) => {
  const OrderDiscounts = db.collection<OrderDiscount>('order_discounts');

  await buildDbIndexes<OrderDiscount>(OrderDiscounts, [
    { index: { orderId: 1 } },
    { index: { code: 1 }, options: { sparse: true } },
  ]);

  return OrderDiscounts;
};

export const OrderDiscountTrigger = {
  USER: 'USER',
  SYSTEM: 'SYSTEM',
} as const;

export type OrderDiscountTrigger = (typeof OrderDiscountTrigger)[keyof typeof OrderDiscountTrigger];
