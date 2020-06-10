import { log } from 'meteor/unchained:core-logger';
import { OrderCheckoutError } from '../../errors';
import getCart from '../../getCart';

export default async function (
  root,
  { orderId, ...transactionContext },
  { user, userId, countryContext, localeContext },
) {
  log('mutation checkoutCart', { orderId, userId });
  const cart = await getCart({ orderId, user, countryContext });
  try {
    return cart.checkout(transactionContext, {
      localeContext,
    });
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
