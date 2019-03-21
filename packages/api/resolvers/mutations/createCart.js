import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { Orders } from 'meteor/unchained:core-orders';
import { Countries } from 'meteor/unchained:core-countries';
import { OrderNumberAlreadyExistsError, UserNotFoundError } from '../../errors';

export default function(root, { orderNumber }, { countryContext, userId }) {
  log('mutation createCart', { userId });
  const order = Orders.findOne({ orderNumber });
  if (order) throw new OrderNumberAlreadyExistsError({ orderNumber });
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  return Orders.createOrder({
    userId: user._id,
    orderNumber,
    currency: Countries.resolveDefaultCurrencyCode({
      isoCode: countryContext
    }),
    countryCode: countryContext
  });
}
