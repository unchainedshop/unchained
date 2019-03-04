import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { Orders, OrderPositions } from 'meteor/unchained:core-orders';
import {
  UserNotFoundError,
  OrderNotFoundError,
  OrderWrongStatusError
} from '../../errors';

export default function(root, { orderId }, { userId, countryContext }) {
  log('mutation emptyCart', { userId, orderId });
  if (orderId) {
    const order = Orders.findOne({ _id: orderId });
    if (!order) throw new OrderNotFoundError({ orderId });
    if (!order.isCart()) {
      throw new OrderWrongStatusError({ data: { status: order.status } });
    }
    OrderPositions.removePositions({ orderId });
    return order;
  }
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const cart = user.cart({ countryContext });
  OrderPositions.removePositions({ orderId: cart._id });
  return cart;
}
