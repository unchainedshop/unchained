import { log } from 'meteor/unchained:logger';
import { Orders } from 'meteor/unchained:core-orders';
import { OrderNotFoundError, InvalidIdError } from '../../errors';

export default function setOrderPaymentProvider(
  root,
  { orderId, paymentProviderId },
  { userId }
) {
  log(`mutation setOrderPaymentProvider ${paymentProviderId}`, {
    orderId,
    userId,
  });
  if (!orderId) throw new InvalidIdError({ orderId });
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  const order = Orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  return order.setPaymentProvider({ paymentProviderId });
}
