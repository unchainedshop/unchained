import { log } from 'meteor/unchained:core-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import {
  OrderQuantityTooLowError,
  OrderItemNotFoundError,
  OrderWrongStatusError
} from '../../errors';

// DEPRECATED
export default function(root, { itemId, quantity }, { userId }) {
  log(`mutation updateCartItemQuantity ${itemId} ${quantity}`, { userId });
  if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });
  const item = OrderPositions.findOne({ _id: itemId });
  if (!item) throw new OrderItemNotFoundError({ itemId });
  const order = item.order();
  if (!order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  return OrderPositions.updatePosition(
    {
      orderId: item.orderId,
      positionId: itemId
    },
    {
      quantity
    }
  );
}
