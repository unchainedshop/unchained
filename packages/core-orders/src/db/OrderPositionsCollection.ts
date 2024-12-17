import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';
import { Price } from '@unchainedshop/utils';

export type OrderPosition = {
  _id?: string;
  calculation: Array<any>;
  configuration: Array<{ key: string; value: string }>;
  context?: any;
  orderId: string;
  originalProductId: string;
  productId: string;
  quantity: number;
  quotationId?: string;
  scheduling: Array<any>;
} & TimestampFields;

export type OrderPositionDiscount = Omit<Price, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPosition;
};

export const OrderPositionsCollection = async (db: mongodb.Db) => {
  const OrderPositions = db.collection<OrderPosition>('order_positions');

  // Order Indexes
  await buildDbIndexes<OrderPosition>(OrderPositions, [
    { index: { productId: 1 } },
    { index: { orderId: 1 } },
  ]);

  return OrderPositions;
};
