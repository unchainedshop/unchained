import { log } from 'meteor/unchained:core-logger';
import { Orders, OrderStatus } from 'meteor/unchained:core-orders';
import { OrderNotFoundError, OrderWrongStatusError } from '../../errors';

export default function (root, {
  billingAddress, contact, orderId, meta,
}, { countryContext, userId }) {
  log('mutation updateOrder', { orderId, userId });
  let order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ data: { orderId } });
  if (order.status !== OrderStatus.OPEN) {
    throw new OrderWrongStatusError({ data: { status: order.status } });
  }
  if (meta) {
    order = order.updateContext(meta);
  }
  if (billingAddress) {
    order = order.updateBillingAddress({ ...billingAddress, countryCode: countryContext });
  }
  if (contact) {
    order = order.updateContact({ contact });
  }
  return order;
}
