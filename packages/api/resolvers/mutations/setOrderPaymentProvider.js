import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';

export default async function(
  root,
  { orderId, paymentProviderId },
  { userId }
) {
  log(`mutation setOrderPaymentProvider ${paymentProviderId}`, {
    orderId,
    userId
  });
  const order = Orders.findOne({ _id: orderId });
  return order.setPaymentProvider({ paymentProviderId });
}
