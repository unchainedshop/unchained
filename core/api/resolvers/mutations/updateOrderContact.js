import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { OrderNotFoundError } from '../errors';

const logger = console;

export default function (root, { contact, orderId }, { userId }) {
  log('mutation updateOrderContact', { orderId, userId });
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ data: { orderId } });
  try {
    return order.updateContact({ contact });
  } catch (error) {
    logger.error(error);
    log('could not update order contact', { contact, orderId, level: 'error' });
    throw error;
  }
}
