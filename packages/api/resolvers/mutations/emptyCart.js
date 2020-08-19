import { log } from 'meteor/unchained:core-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import getCart from '../../getCart';
import { InvalidIdError } from '../../errors';

export default async function (
  root,
  { orderId },
  { user, userId, countryContext },
) {
  log('mutation emptyCart', { userId, orderId });
  if (!orderId) throw new InvalidIdError({ orderId });
  const cart = await getCart({ orderId, user, countryContext });
  if (!cart) return null;
  OrderPositions.removePositions({ orderId: cart._id });
  return cart;
}
