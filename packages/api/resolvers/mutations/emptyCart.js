import { log } from 'meteor/unchained:core-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import getCart from '../../getCart';

export default function(root, { orderId }, { userId, countryContext }) {
  log('mutation emptyCart', { userId, orderId });
  const cart = getCart({ orderId, userId, countryContext });
  if (!cart) return null;
  OrderPositions.removePositions({ orderId: cart._id });
  return cart;
}
