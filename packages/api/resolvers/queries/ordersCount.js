import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';

export default function ordersCount(root, { includeCarts }, { userId }) {
  log(`query ordersCount: ${includeCarts ? 'includeCart' : ''}`, { userId });
  return Orders.count({ includeCarts });
}
