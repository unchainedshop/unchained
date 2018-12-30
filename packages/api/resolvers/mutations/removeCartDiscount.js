import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function (root, { discountId }, { userId, countryContext }) {
  log(`mutation removeCartDiscount ${discountId}`, { userId });
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const cart = user.initCart({ countryContext });
  return cart.removeDiscount({ discountId });
}
