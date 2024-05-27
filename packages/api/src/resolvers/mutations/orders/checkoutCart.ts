import { Context, Root } from '@unchainedshop/types/api.js';
import { log, LogLevel } from '@unchainedshop/logger';
import { OrderCheckoutError } from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';

export default async function checkoutCart(
  root: Root,
  params: {
    orderId: string;
    orderContext?: any;
    paymentContext?: any;
    deliveryContext?: any;
  },
  context: Context,
) {
  const { modules, user, userId } = context;
  const { orderId: forceOrderId, ...transactionContext } = params;

  log('mutation checkoutCart', { orderId: forceOrderId, userId });

  const orderId = (await getOrderCart({ orderId: forceOrderId, user }, context))._id;

  try {
    const order = await modules.orders.checkout(orderId, transactionContext, context);
    return order;
  } catch (error) {
    log(error.message, { userId, orderId, level: LogLevel.Error });
    throw new OrderCheckoutError({
      userId,
      orderId,
      ...transactionContext,
      detailCode: error.name || error.code,
      detailMessage: error.message,
    });
  }
}
