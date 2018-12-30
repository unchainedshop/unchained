import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { OrderNotFoundError } from '../../errors';

const logger = console;

export default function (root, {
  address, contact, orderId, meta,
}, { countryContext, userId }) {
  log('mutation updateOrder', { orderId, userId });
  let order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ data: { orderId } });
  try {
    if (meta) {
      order = order.updateContext(meta);
    }
    if (address) {
      order = order.updateAddress({ ...address, countryCode: countryContext });
    }
    if (contact) {
      order = order.updateContact({ contact });
    }
    return order;
  } catch (error) {
    logger.error(error);
    log('could not update order', {
      userId, countryCode: countryContext, orderId, level: 'error',
    });
    throw error;
  }
}
