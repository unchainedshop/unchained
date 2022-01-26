import { Db } from '@unchainedshop/types/common';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const OrderPaymentsCollection = async (db: Db) => {
  const OrderPayments = db.collection<OrderPayment>('order_payments');

  // Order Indexes
  await buildDbIndexes<OrderPayment>(OrderPayments, [{ index: { orderId: 1 } }]);

  return OrderPayments;
};
