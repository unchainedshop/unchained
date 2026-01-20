import { mongodb, buildDbIndexes, type LogFields, type TimestampFields } from '@unchainedshop/mongodb';
import type { Price } from '@unchainedshop/utils';

export const OrderPaymentStatus = {
  OPEN: 'OPEN', // Null value is mapped to OPEN status
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const;

export type OrderPaymentStatus = (typeof OrderPaymentStatus)[keyof typeof OrderPaymentStatus];

export type OrderPayment = {
  _id: string;
  orderId: string;
  context?: any;
  paid?: Date;
  transactionId?: string;
  paymentProviderId: string;
  status?: OrderPaymentStatus | null;
  calculation?: any[];
} & LogFields &
  TimestampFields;

export type OrderPaymentDiscount = Omit<Price, '_id'> & {
  _id: string;
  discountId: string;
  item: OrderPayment;
};

export const OrderPaymentsCollection = async (db: mongodb.Db) => {
  const OrderPayments = db.collection<OrderPayment>('order_payments');

  // Order Indexes
  await buildDbIndexes<OrderPayment>(OrderPayments, [
    { index: { orderId: 1 } },
    {
      index: { orderId: 1, paymentProviderId: 1 },
    },
  ]);

  return OrderPayments;
};
