import { log } from 'meteor/unchained:core-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import { OrderItemNotFoundError, OrderWrongStatusError } from '../../errors';

export default function (root, { itemId }, { userId }) {
  log(`mutation removeCartItem ${itemId}`, { userId });
  if (!itemId) throw new Error('Invalid item ID provided');
  const orderItem = OrderPositions.findOne({ _id: itemId });
  if (!orderItem) throw new OrderItemNotFoundError({ orderItem });
  const order = orderItem.order();
  if (!order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  return OrderPositions.removePosition({
    positionId: itemId,
  });
}
