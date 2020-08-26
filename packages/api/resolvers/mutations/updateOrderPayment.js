import { log } from 'meteor/unchained:core-logger';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { OrderPaymentNotFoundError, InvalidIdError } from '../../errors';

export default function updateOrderPayment(
  root,
  { orderPaymentId, ...context },
  { userId },
) {
  log(`mutation updateOrderPayment ${orderPaymentId}`, { userId });
  if (!orderPaymentId) throw new InvalidIdError({ orderPaymentId });
  const orderPayment = OrderPayments.findOne({ _id: orderPaymentId });
  if (!orderPayment)
    throw new OrderPaymentNotFoundError({ data: { orderPaymentId } });
  return orderPayment.updateContext(context);
}
