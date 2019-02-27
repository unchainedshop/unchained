import { log } from 'meteor/unchained:core-logger';
import { Orders, OrderStatus } from 'meteor/unchained:core-orders';
import { Users } from 'meteor/unchained:core-users';
import {
  UserNotFoundError, OrderCheckoutError, UserNoCartError,
  OrderWrongStatusError, OrderNotFoundError,
} from '../../errors';

const checkoutWithPotentialErrors = (
  cart, context, options, userId,
) => {
  try {
    return cart.checkout(context, options);
  } catch (error) {
    const data = {
      userId,
      orderId: cart._id,
      ...context,
      detailMessage: error.message,
    };
    log(data.detailMessage, { userId, orderId: cart._id, level: 'error' });
    throw new OrderCheckoutError({ data });
  }
};

export default function (root, {
  orderId,
  paymentContext,
  deliveryContext,
  orderContext,
}, {
  userId,
  countryContext,
  localeContext,
}) {
  log('mutation checkoutCart', { orderId, userId });
  if (orderId) {
    const order = Orders.findOne({ _id: orderId });
    if (!order) throw new OrderNotFoundError({ data: { orderId } });
    if (!order.isCart()) {
      throw new OrderWrongStatusError({ data: { status: order.status } });
    }
    checkoutWithPotentialErrors(order, {
      orderContext,
      paymentContext,
      deliveryContext,
    }, {
      localeContext,
    }, userId);
  }
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ data: { userId } });
  const cart = user.cart({ countryContext });
  if (!cart) throw new UserNoCartError({ data: { userId } });
  checkoutWithPotentialErrors(cart, {
    orderContext,
    paymentContext,
    deliveryContext,
  }, {
    localeContext,
  }, userId);
}
