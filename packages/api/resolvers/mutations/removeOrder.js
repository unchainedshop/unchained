import { log } from 'meteor/unchained:logger';
import { Orders } from 'meteor/unchained:core-orders';
import {
  OrderNotFoundError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function removeOrder(root, { orderId }, { userId }) {
  log('mutation removeOrder', { userId, orderId });
  if (!orderId) throw new InvalidIdError({ orderId });
  const order = Orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  Orders.removeOrder({ orderId });
  return order;
}
