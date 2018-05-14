import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { OrderNotFoundError } from '../errors';

const logger = console;

export default function (root, { address, orderId }, { countryContext, userId }) {
  log('mutation updateOrderAddress', { orderId, userId });
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ data: { orderId } });
  try {
    return order.updateAddress({ ...address, countryCode: countryContext });
  } catch (error) {
    logger.error(error);
    log('could not update order contact', {
      userId, countryCode: countryContext, orderId, level: 'error',
    });
    throw error;
  }
}
