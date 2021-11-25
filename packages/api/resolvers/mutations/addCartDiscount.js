import { log } from 'meteor/unchained:logger';
import getCart from '../../getCart';

export default async function addCartDiscount(
  root,
  { orderId, code },
  { userId, user, countryContext }
) {
  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });
  const cart = await getCart({ orderId, user, countryContext });
  return cart.addDiscount({ code });
}
