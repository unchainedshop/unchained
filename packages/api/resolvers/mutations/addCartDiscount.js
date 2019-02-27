import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { Orders, OrderStatus } from 'meteor/unchained:core-orders';
import { UserNotFoundError, OrderNotFoundError, OrderWrongStatusError } from '../../errors';

export default function (root, { orderId, code }, { userId, countryContext }) {
  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });
  if (orderId) {
    const order = Orders.findOne({ _id: orderId });
    if (!order) throw new OrderNotFoundError({ orderId });
    if (order.status !== OrderStatus.OPEN) {
      throw new OrderWrongStatusError({ data: { status: order.status } });
    }
    return order.addDiscount({ code });
  }
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const cart = user.initCart({ countryContext });
  return cart.addDiscount({ code });
}
