import { log } from 'meteor/unchained:core-logger';
import { OrderDeliveries } from 'meteor/unchained:core-orders';
import { OrderDeliveryNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { orderDeliveryId, ...context }, { userId }) {
  log(`mutation updateOrderDelivery ${orderDeliveryId}`, { userId });
  if (!orderDeliveryId) throw new InvalidIdError({ orderDeliveryId });
  const orderDelivery = OrderDeliveries.findOne({ _id: orderDeliveryId });
  if (!orderDelivery) throw new OrderDeliveryNotFoundError({ orderDeliveryId });
  return orderDelivery.updateContext(context);
}
