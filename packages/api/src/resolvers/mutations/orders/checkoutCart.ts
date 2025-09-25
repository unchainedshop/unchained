import { Context } from '../../../context.js';
import { OrderCheckoutError, OrderNotFoundError } from '../../../errors.js';
import { createLogger, log } from '@unchainedshop/logger';

const logger = createLogger('unchained:api');

export default async function checkoutCart(
  root: never,
  params: {
    orderId: string;
    paymentContext?: any;
    deliveryContext?: any;
  },
  context: Context,
) {
  const { services, user, userId } = context;
  const { orderId: forceOrderId, ...transactionContext } = params;

  log('mutation checkoutCart', { orderId: forceOrderId, userId });

  // Do not check for order status here! The checkout method will act accordingly
  const order = await services.orders.findOrInitCart({
    orderId: forceOrderId,
    user,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId: forceOrderId });

  try {
    const checkedOutOrder = await services.orders.checkoutOrder(order._id, transactionContext);
    return checkedOutOrder;
  } catch (error) {
    logger.error(error, { userId, orderId: order._id });
    throw new OrderCheckoutError({
      userId,
      orderId: order._id,
      ...transactionContext,
      detailCode: error.name || error.code,
      detailMessage: error.message,
    });
  }
}
