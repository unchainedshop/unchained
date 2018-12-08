import { log } from 'meteor/unchained:core-logger';
import { OrderDeliveries } from 'meteor/unchained:core-orders';

import { OrderDeliveryNotFoundError } from '../errors';

const logger = console;

export default function (root, { orderDeliveryId, ...context }, { userId }) {
  log(`mutation updateOrderDelivery ${orderDeliveryId}`, { userId });
  const orderDelivery = OrderDeliveries.findOne({ _id: orderDeliveryId });
  if (!orderDelivery) {
    log('order delivery not found', { userId, orderDeliveryId, level: 'error' });
    throw new OrderDeliveryNotFoundError({ data: { orderDeliveryId } });
  }
  try {
    return orderDelivery.updateContext(context);
  } catch (error) {
    logger.error(error);
    log('order delivery context update error', { userId, orderDeliveryId, level: 'error' });
    throw error;
  }
}
