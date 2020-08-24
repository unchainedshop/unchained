import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import {
  OrderNotFoundError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function removeOrder(root, { orderId }, { userId }) {
  log('mutation removeOrder', { userId, orderId });
  if (!orderId) throw new InvalidIdError({ orderId });
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  Orders.remove({ _id: orderId });
  return order;
}
