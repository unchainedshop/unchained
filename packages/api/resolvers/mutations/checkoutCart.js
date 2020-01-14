import { log } from 'meteor/unchained:core-logger';
import { OrderCheckoutError } from '../../errors';
import getCart from '../../getCart';

export default function(
  root,
  { orderId, ...transactionContext },
  {
    user,
    userId,
    countryContext,
    localeContext,
    remoteAddress,
    remotePort,
    userAgent
  }
) {
  log('mutation checkoutCart', { orderId, userId });
  const cart = getCart({ orderId, user, countryContext });
  try {
    return cart.checkout(
      transactionContext,
      {
        localeContext
      },
      { remoteAddress, remotePort, userAgent }
    );
  } catch (error) {
    log(error.message, { userId, orderId: cart._id, level: 'error' });
    throw new OrderCheckoutError({
      userId,
      orderId: cart._id,
      ...transactionContext,
      detailMessage: error.message
    });
  }
}
