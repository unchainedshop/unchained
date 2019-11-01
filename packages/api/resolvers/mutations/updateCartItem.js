import { log } from 'meteor/unchained:core-logger';
import { OrderPositions } from 'meteor/unchained:core-orders';
import {
  OrderQuantityTooLowError,
  OrderItemNotFoundError,
  OrderWrongStatusError
} from '../../errors';

export default function(
  root,
  { itemId, quantity = null, configuration = null },
  { userId }
) {
  log(
    `mutation updateCartItem ${itemId} ${quantity} ${JSON.stringify(
      configuration
    )}`,
    { userId }
  );
  const item = OrderPositions.findOne({ _id: itemId });
  if (!item) throw new OrderItemNotFoundError({ itemId });
  const order = item.order();
  if (!order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  if (quantity !== null) {
    if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });
    // FIXME: positionId is actually
    OrderPositions.updatePosition(
      {
        orderId: item.orderId,
        positionId: itemId
      },
      { quantity }
    );
  }

  if (configuration !== null) {
    OrderPositions.updatePosition(
      {
        orderId: item.orderId,
        positionId: itemId
      },
      { configuration }
    );
  }

  return OrderPositions.findOne({ _id: itemId });
}
