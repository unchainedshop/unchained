import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { Countries } from 'meteor/unchained:core-countries';
import { OrderNumberAlreadyExistsError, UserNotFoundError } from '../../errors';

export default async function (
  root,
  { orderNumber },
  { countryContext, userId, user },
) {
  log('mutation createCart', { userId });
  const order = Orders.findOne({ orderNumber });
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
