import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { OrderNotFoundError } from '../../errors';

export default function (root, { orderId, deliveryProviderId }, { userId }) {
  log(`mutation setOrderDeliveryProvider ${deliveryProviderId}`, {
    orderId,
    userId,
  });
  if (!orderId || !deliveryProviderId)
    throw new Error('Invalid order or delivery provider ID provided');
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  return order.setDeliveryProvider({ deliveryProviderId });
}
