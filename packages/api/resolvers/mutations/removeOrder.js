import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { OrderNotFoundError, OrderWrongStatusError } from '../../errors';

export default function (root, { orderId }, { userId }) {
  log('mutation removeOrder', { userId, orderId });
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  Orders.remove({ _id: orderId });
  return order;
}
