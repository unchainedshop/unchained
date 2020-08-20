import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { OrderNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { orderId, paymentProviderId }, { userId }) {
  log(`mutation setOrderPaymentProvider ${paymentProviderId}`, {
    orderId,
    userId,
  });
  if (!orderId) throw new InvalidIdError({ orderId });
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  return order.setPaymentProvider({ paymentProviderId });
}
