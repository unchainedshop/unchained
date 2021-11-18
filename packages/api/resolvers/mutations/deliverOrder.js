import { log } from 'unchained-logger';
import { Orders, OrderDeliveryStatus } from 'meteor/unchained:core-orders';
import {
  OrderNotFoundError,
  OrderWrongDeliveryStatusError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function deliverOrder(root, { orderId }, { userId }) {
  log('mutation deliverOrder', { orderId, userId });
  if (!orderId) throw new InvalidIdError({ orderId });
  const order = Orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  const delivery = order.delivery();
  if (delivery.status !== OrderDeliveryStatus.OPEN && order.confirmed) {
    throw new OrderWrongDeliveryStatusError({
      status: delivery.status,
    });
  }
  delivery.markDelivered();
  return order.processOrder();
}
