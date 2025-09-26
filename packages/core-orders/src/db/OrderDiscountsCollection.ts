import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';
import { Price } from '@unchainedshop/utils';

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

  // Order Indexes
  await buildDbIndexes<OrderDiscount>(OrderDiscounts, [
    { index: { orderId: 1 } },
    { index: { trigger: 1 } },
  ]);

  return OrderDiscounts;
};

export enum OrderDiscountTrigger {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}
