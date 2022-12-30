import { Db } from '@unchainedshop/types/common.js';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { buildDbIndexes } from '@unchainedshop/utils';

export const OrderPaymentsCollection = async (db: Db) => {
  const OrderPayments = db.collection<OrderPayment>('order_payments');

  // Order Indexes
  await buildDbIndexes<OrderPayment>(OrderPayments, [{ index: { orderId: 1 } }]);

  return OrderPayments;
};
