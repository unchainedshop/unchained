import { log } from 'unchained-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import getCart from '../../getCart';

export default async function emptyCart(
  root,
  { orderId },
  { user, userId, countryContext }
) {
  log('mutation emptyCart', { userId, orderId });
  const cart = await getCart({ orderId, user, countryContext });
  if (!cart) return null;
  OrderPositions.removePositions({ orderId: cart._id });
  return cart;
}
