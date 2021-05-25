import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';

export default function ordersCount(
  root,
  { includeCarts, queryString },
  { userId }
) {
  log(
    `query ordersCount: ${includeCarts ? 'includeCart' : ''} ${queryString}`,
    { userId }
  );
  return Orders.count({ includeCarts });
}
