import { log } from 'meteor/unchained:core-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError, OrderQuantityTooLowError, OrderItemNotFound } from '../errors';

export default function (root, { itemId, quantity }, { userId, countryContext }) {
  log(`mutation updateCartItemQuantity ${itemId} ${quantity}`, { userId });
  if (quantity === 0) {
    throw new OrderQuantityTooLowError({ data: { quantity } });
  }
  if (OrderPositions.find({ _id: itemId }).count() === 0) {
    throw new OrderItemNotFound({ data: { itemId } });
  }
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const cart = user.initCart({ countryContext });
  return cart.updateItemQuantity({ itemId, quantity });
}
