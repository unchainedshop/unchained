import { log } from 'meteor/unchained:core-logger';
import { Orders, OrderStatus } from 'meteor/unchained:core-orders';
import { OrderNotFoundError, OrderWrongStatusError } from '../../errors';

export default function (root, { orderId, ...rest }, { userId, localeContext }) {
  log('mutation confirmOrder', { orderId, userId });
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ data: { orderId } });
  if (order.status !== OrderStatus.PENDING) {
    throw new OrderWrongStatusError({ data: { status: order.status } });
  }
  return order.confirm({ ...rest }, { localeContext });
}
