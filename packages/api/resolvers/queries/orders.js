import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';

export default function orders(
  root,
  { limit, offset, includeCarts },
  { userId }
) {
  log(`query orders: ${limit} ${offset} ${includeCarts}`, { userId });
  return Orders.findOrders({ limit, offset, includeCarts });
}
