import { log } from 'meteor/unchained:core-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import { OrderItemNotFoundError, OrderWrongStatusError } from '../../errors';

export default async function(root, { itemId }, { userId }) {
  log(`mutation removeCartItem ${itemId}`, { userId });
  const orderItem = OrderPositions.findOne({ _id: itemId });
  if (!orderItem) throw new OrderItemNotFoundError({ data: { orderItem } });
  const order = orderItem.order();
  if (!order.isCart()) {
    throw new OrderWrongStatusError({ data: { status: order.status } });
  }
  return OrderPositions.removePosition({
    positionId: itemId
  });
}
