import { Context, Root } from '@unchainedshop/types/api';
import { log, LogLevel } from 'meteor/unchained:logger';
import { OrderCheckoutError } from '../../../errors';
import { getOrderCart } from '../utils/getOrderCart';

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
  const { modules, userId } = context;
  const { orderId: forceOrderId, ...transactionContext } = params;

  log('mutation checkoutCart', { orderId: forceOrderId, userId });

  const orderId = forceOrderId || (await getOrderCart({}, context))._id;

  try {
    const order = await modules.orders.checkout(orderId, transactionContext, context);
    return order;
  } catch (error) {
    log(error.message, { userId, orderId, level: LogLevel.Error });

    throw new OrderCheckoutError({
      userId,
      orderId,
      ...transactionContext,
      detailMessage: error.message,
    });
  }
}
