import { log } from 'meteor/unchained:core-logger';
import getCart from '../../getCart';
import { InvalidIdError } from '../../errors';

export default async function (
  root,
  { orderId, code },
  { userId, user, countryContext },
) {
  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });
  if (!orderId) throw new InvalidIdError({ orderId });
  const cart = await getCart({ orderId, user, countryContext });
  return cart.addDiscount({ code });
}
