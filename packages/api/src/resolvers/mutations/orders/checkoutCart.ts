import { Context } from '../../../context.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { OrderCheckoutError } from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';

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
    order = await services.orders.checkoutOrder(order._id, transactionContext, context);
    return order;
  } catch (error) {
    log(error.message, { userId, orderId: order._id, level: LogLevel.Error });
    throw new OrderCheckoutError({
      userId,
      orderId: order._id,
      ...transactionContext,
      detailCode: error.name || error.code,
      detailMessage: error.message,
    });
  }
}
