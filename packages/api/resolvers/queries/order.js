import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { InvalidIdError } from '../../errors';

export default function order(root, { orderId }, { userId }) {
  log(`query order ${orderId}`, { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });
  return Orders.findOrder({ orderId });
}
