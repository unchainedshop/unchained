import { log } from 'unchained-logger';
import { Orders } from 'meteor/unchained:core-orders';

export default async function orders(
  root,
  { limit, offset, includeCarts, queryString },
  { userId }
) {
  log(`query orders: ${limit} ${offset} ${includeCarts} ${queryString}`, {
    userId,
  });
  return Orders.findOrders({
    limit,
    offset,
    includeCarts,
    queryString,
  });
}
