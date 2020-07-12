import { log } from 'meteor/unchained:core-logger';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { OrderPaymentNotFoundError } from '../../errors';

export default function (root, { orderPaymentId, ...context }, { userId }) {
  log(`mutation updateOrderPayment ${orderPaymentId}`, { userId });
  if (!orderPaymentId) throw new Error('Invalid order payment ID provided');
  const orderPayment = OrderPayments.findOne({ _id: orderPaymentId });
  if (!orderPayment)
    throw new OrderPaymentNotFoundError({ data: { orderPaymentId } });
  return orderPayment.updateContext(context);
}
