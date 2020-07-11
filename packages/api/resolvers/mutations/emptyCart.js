import { log } from 'meteor/unchained:core-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import getCart from '../../getCart';

export default async function (
  root,
  { orderId },
  { user, userId, countryContext },
) {
  log('mutation emptyCart', { userId, orderId });
  if (!orderId) throw new Error('Invalid order ID provided');
  const cart = await getCart({ orderId, user, countryContext });
  if (!cart) return null;
  OrderPositions.removePositions({ orderId: cart._id });
  return cart;
}
