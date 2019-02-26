import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function (root, {
  address, contact, meta,
}, { countryContext, userId }) {
  log('mutation updateCart', { userId });
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  let order = user.initCart({ countryContext });
  if (meta) {
    order = order.updateContext(meta);
  }
  if (address) {
    order = order.updateAddress({ ...address, countryCode: countryContext });
  }
  if (contact) {
    order = order.updateContact({ contact });
  }
  return order;
}
