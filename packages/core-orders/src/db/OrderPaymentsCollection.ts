import { mongodb, buildDbIndexes, LogFields, TimestampFields } from '@unchainedshop/mongodb';
import { Price } from '@unchainedshop/utils';

export enum OrderPaymentStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export type OrderPayment = {
  _id?: string;
  orderId: string;
  context?: any;
  paid?: Date;
  transactionId?: string;
  paymentProviderId?: string;
  status?: OrderPaymentStatus | null;
  calculation?: Array<any>;
} & LogFields &
  TimestampFields;

export type OrderPaymentDiscount = Omit<Price, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPayment;
};

export const OrderPaymentsCollection = async (db: mongodb.Db) => {
  const OrderPayments = db.collection<OrderPayment>('order_payments');

  // Order Indexes
  await buildDbIndexes<OrderPayment>(OrderPayments, [{ index: { orderId: 1 } }]);

  return OrderPayments;
};
