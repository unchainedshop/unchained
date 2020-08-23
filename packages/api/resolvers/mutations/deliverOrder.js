import { log } from 'meteor/unchained:core-logger';
import { Orders, OrderDeliveryStatus } from 'meteor/unchained:core-orders';
import {
  OrderNotFoundError,
  OrderWrongDeliveryStatusError,
  OrderWrongStatusError,
} from '../../errors';

export default function deliverOrder(root, { orderId }, { userId }) {
  log('mutation deliverOrder', { orderId, userId });
  const order = Orders.findOne({ _id: orderId });
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
