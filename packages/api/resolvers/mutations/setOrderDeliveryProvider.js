import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';

export default function (root, { orderId, deliveryProviderId }, { userId }) {
  log(`mutation setOrderDeliveryProvider ${deliveryProviderId}`, { orderId, userId });
  const order = Orders.findOne({ _id: orderId });
  return order.setDeliveryProvider({ deliveryProviderId });
}
