import { mongodb, buildDbIndexes, type LogFields, type TimestampFields } from '@unchainedshop/mongodb';
import type { Price } from '@unchainedshop/utils';

export const OrderDeliveryStatus = {
  OPEN: 'OPEN', // Null value is mapped to OPEN status
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
} as const;

export type OrderDeliveryStatus = (typeof OrderDeliveryStatus)[keyof typeof OrderDeliveryStatus];

export type OrderDelivery = {
  _id: string;
  orderId: string;
  deliveryProviderId: string;
  delivered?: Date;
  status: OrderDeliveryStatus | null;
  context?: any;
  calculation: any[];
} & LogFields &
  TimestampFields;

export type OrderDeliveryDiscount = Omit<Price, '_id'> & {
  _id: string;
  discountId: string;
  item: OrderDelivery;
};

export const OrderDeliveriesCollection = async (db: mongodb.Db) => {
  const OrderDeliveries = db.collection<OrderDelivery>('order_deliveries');

  // Order Indexes
  await buildDbIndexes<OrderDelivery>(OrderDeliveries, [
    { index: { orderId: 1 } },
    { index: { orderId: 1, deliveryProviderId: 1 } },
  ]);

  return OrderDeliveries;
};
