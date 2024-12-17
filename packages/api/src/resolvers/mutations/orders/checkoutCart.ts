import { Context } from '../../../context.js';
import { OrderCheckoutError } from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';
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
  let order = await getOrderCart({ orderId: forceOrderId, user }, context);

  try {
    order = await services.orders.checkoutOrder(order._id, transactionContext);
    return order;
  } catch (error) {
    logger.error(error.message, { userId, orderId: order._id });
    throw new OrderCheckoutError({
      userId,
      orderId: order._id,
      ...transactionContext,
      detailCode: error.name || error.code,
      detailMessage: error.message,
    });
  }
}
