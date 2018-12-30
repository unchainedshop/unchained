import { log } from 'meteor/unchained:core-logger';
import { OrderStatus } from 'meteor/unchained:core-orders';
import { Users } from 'meteor/unchained:core-users';
import {
  UserNotFoundError, OrderCheckoutError, UserNoCartError,
  OrderWrongStatusError,
} from '../../errors';

const logger = console;

export default function (root, {
  paymentContext,
  deliveryContext,
  orderContext,
}, {
  userId,
  countryContext,
  localeContext,
}) {
  log('mutation checkout', { userId });
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ data: { userId } });
  const cart = user.cart({ countryContext });
  if (!cart) throw new UserNoCartError({ data: { userId } });
  if (cart.status !== OrderStatus.OPEN) {
    throw new OrderWrongStatusError({ data: { status: cart.status } });
  }
  try {
    return cart.checkout({
      orderContext,
      paymentContext,
      deliveryContext,
    }, {
      localeContext,
    });
  } catch (error) {
    const data = {
      userId,
      orderId: cart._id,
      paymentContext,
      deliveryContext,
      detailMessage: error.message,
    };
    logger.error(error);
    log(data, { userId, orderId: cart._id, level: 'error' });
    throw new OrderCheckoutError({ data });
  }
}
