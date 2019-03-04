import { log } from 'meteor/unchained:core-logger';
import { OrderDeliveries } from 'meteor/unchained:core-orders';
import { OrderDeliveryNotFoundError } from '../../errors';

export default function(root, { orderDeliveryId, ...context }, { userId }) {
  log(`mutation updateOrderDelivery ${orderDeliveryId}`, { userId });
  const orderDelivery = OrderDeliveries.findOne({ _id: orderDeliveryId });
  if (!orderDelivery)
    throw new OrderDeliveryNotFoundError({ data: { orderDeliveryId } });
  return orderDelivery.updateContext(context);
}
