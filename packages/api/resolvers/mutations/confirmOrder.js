import { log } from 'meteor/unchained:core-logger';
import { Orders, OrderStatus } from 'meteor/unchained:core-orders';
import { OrderNotFoundError, OrderWrongStatusError } from '../../errors';

export default function (
  root,
  { orderId, ...transactionContext },
  { userId, localeContext },
) {
  log('mutation confirmOrder', { orderId, userId });
  if (!orderId) throw new Error('Invalid order ID provided');
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (order.status !== OrderStatus.PENDING) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  return order.confirm(transactionContext, { localeContext });
}
