import { log } from 'meteor/unchained:core-logger';
import getCart from '../../getCart';

export default function(root, { orderId, code }, { userId, countryContext }) {
  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });
  const cart = getCart({ orderId, userId, countryContext });
  return cart.addDiscount({ code });
}
