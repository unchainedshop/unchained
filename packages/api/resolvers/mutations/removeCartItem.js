import { log } from 'meteor/unchained:core-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import {
  OrderItemNotFoundError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function removeCartItem(root, { itemId }, { userId }) {
  log(`mutation removeCartItem ${itemId}`, { userId });
  if (!itemId) throw new InvalidIdError({ itemId });
  const orderItem = OrderPositions.findItem({ itemId });
  if (!orderItem) throw new OrderItemNotFoundError({ orderItem });
  const order = orderItem.order();
  if (!order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  return OrderPositions.removePosition({
    positionId: itemId,
  });
}
