import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function (root, { code }, { userId, countryContext }) {
  log(`mutation addCartDiscount ${code}`, { userId });
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const cart = user.initCart({ countryContext });
  return cart.addDiscount({ code });
}
