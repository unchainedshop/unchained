import type { Context } from '../../../context.ts';
import { OrderCheckoutError, OrderNotFoundError } from '../../../errors.ts';
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
    user: user!,
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
      // Errors created via `createError` (e.g. a custom validateOrderPosition
      // throwing ProductNotOrderableError) are GraphQLError subclasses whose
      // `.name` is the literal "GraphQLError" and whose real code lives in
      // `extensions.code`. Prefer that so the business code is not flattened to
      // "GraphQLError"; fall back to `.name` (createServiceError) / `.code`.
      detailCode: error.extensions?.code || error.name || error.code,
      detailMessage: error.message,
    });
  }
}
