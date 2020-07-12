import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { OrderNotFoundError } from '../../errors';

export default function (root, { orderId, paymentProviderId }, { userId }) {
  log(`mutation setOrderPaymentProvider ${paymentProviderId}`, {
    orderId,
    userId,
  });
  if (!orderId || !paymentProviderId)
    throw new Error('Invalid order or payment provider ID provided');
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  return order.setPaymentProvider({ paymentProviderId });
}
