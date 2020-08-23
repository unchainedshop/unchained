import { log } from 'meteor/unchained:core-logger';
import { Orders, OrderStatus } from 'meteor/unchained:core-orders';

export default function orders(
  root,
  { limit, offset, includeCarts },
  { userId },
) {
  log(`query orders: ${limit} ${offset} ${includeCarts}`, { userId });
  const selector = {};
  if (!includeCarts) {
    selector.status = { $ne: OrderStatus.OPEN };
  }
  const options = {
    skip: offset,
    limit,
    sort: {
      created: -1,
    },
  };
  return Orders.find(selector, options).fetch();
}
