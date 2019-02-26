import { log } from 'meteor/unchained:core-logger';
import { Orders, OrderStatus } from 'meteor/unchained:core-orders';
import { OrderNotFoundError, OrderWrongStatusError, OrderCheckoutError } from '../../errors';

const logger = console;

export default function (root, {
  orderId,
  paymentContext,
  deliveryContext,
  orderContext,
}, {
  userId,
  localeContext,
}) {
  log('mutation checkoutOrder', { orderId, userId });
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ data: { orderId } });
  if (order.status !== OrderStatus.OPEN) {
    throw new OrderWrongStatusError({ data: { status: order.status } });
  }
  try {
    return order.checkout({
      orderContext,
      paymentContext,
      deliveryContext,
    }, {
      localeContext,
    });
  } catch (error) {
    const data = {
      userId,
      orderId,
      paymentContext,
      deliveryContext,
      detailMessage: error.message,
    };
    logger.error(error);
    log(data, { userId, orderId, level: 'error' });
    throw new OrderCheckoutError({ data });
  }
}
