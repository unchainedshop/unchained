import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { transformOrder } from '../transformations/transformOrder';

export default async function orders(
  root,
  { limit, offset, includeCarts, queryString },
  { modules, userId }
) {
  log(`query orders: ${limit} ${offset} ${includeCarts} ${queryString}`, {
    userId,
  });
  const orders = Orders.findOrders({
    limit,
    offset,
    includeCarts,
    queryString,
  });
  return orders.map(transformOrder(modules));
}
