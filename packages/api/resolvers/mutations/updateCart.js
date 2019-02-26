import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function (root, {
  billingAddress, contact, meta,
}, { countryContext, userId }) {
  log('mutation updateCart', { userId });
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  let order = user.initCart({ countryContext });
  if (meta) {
    order = order.updateContext(meta);
  }
  if (billingAddress) {
    order = order.updateBillingAddress({ ...billingAddress, countryCode: countryContext });
  }
  if (contact) {
    order = order.updateContact({ contact });
  }
  return order;
}
