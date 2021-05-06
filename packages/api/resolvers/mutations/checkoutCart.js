import { log } from 'meteor/unchained:core-logger';
import { OrderCheckoutError } from '../../errors';
import getCart from '../../getCart';

export default async function checkoutCart(
  root,
  { orderId, ...transactionContext },
  { user, userId, countryContext, localeContext }
) {
  log('mutation checkoutCart', { orderId, userId });
  const cart = await getCart({ orderId, user, countryContext });
  try {
    const order = await cart.checkout(transactionContext, {
      localeContext,
    });
    return order;
  } catch (error) {
    log(error.message, { userId, orderId: cart._id, level: 'error' });
    throw new OrderCheckoutError({
      userId,
      orderId: cart._id,
      ...transactionContext,
      detailMessage: error.message,
    });
  }
}
