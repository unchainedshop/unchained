import { log } from 'meteor/unchained:logger';
import { Orders } from 'meteor/unchained:core-orders';
import { Countries } from 'meteor/unchained:core-countries';
import { OrderNumberAlreadyExistsError, UserNotFoundError } from '../../errors';

export default async function createCart(
  root,
  { orderNumber },
  { countryContext, userId, user }
) {
  log('mutation createCart', { userId });
  const order = Orders.findOrder({ orderNumber });
  if (order) throw new OrderNumberAlreadyExistsError({ orderNumber });
  if (!user) throw new UserNotFoundError({ userId });
  return Orders.createOrder({
    user,
    orderNumber,
    currency: Countries.resolveDefaultCurrencyCode({
      isoCode: countryContext,
    }),
    countryCode: countryContext,
  });
}
