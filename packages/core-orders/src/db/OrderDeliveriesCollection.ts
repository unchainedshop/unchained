import { mongodb, buildDbIndexes, LogFields, TimestampFields } from '@unchainedshop/mongodb';
import { Price } from '@unchainedshop/utils';

export enum OrderDeliveryStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

export type OrderDelivery = {
  _id?: string;
  orderId: string;
  deliveryProviderId: string;
  delivered?: Date;
  status: OrderDeliveryStatus | null;
  context?: any;
  calculation: Array<any>;
} & LogFields &
  TimestampFields;

export type OrderDeliveryDiscount = Omit<Price, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderDelivery;
};

export const OrderDeliveriesCollection = async (db: mongodb.Db) => {
  const OrderDeliveries = db.collection<OrderDelivery>('order_deliveries');

  // Order Indexes
  await buildDbIndexes<OrderDelivery>(OrderDeliveries, [{ index: { orderId: 1 } }]);

  return OrderDeliveries;
};
