import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { OrderPayment } from '@unchainedshop/types/orders.payments.js';

export const OrderPaymentsCollection = async (db: mongodb.Db) => {
  const OrderPayments = db.collection<OrderPayment>('order_payments');

  // Order Indexes
  await buildDbIndexes<OrderPayment>(OrderPayments, [{ index: { orderId: 1 } }]);

  return OrderPayments;
};
