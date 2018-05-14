import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';

export default function (root, { limit = 10, offset = 0 }, { userId }) {
  log(`query orders: ${limit} ${offset}`, { userId });
  const selector = { };
  const orders = Orders.find(selector, { skip: offset, limit }).fetch();
  return orders;
}
