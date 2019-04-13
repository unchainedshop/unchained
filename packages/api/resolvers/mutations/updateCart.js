import { log } from 'meteor/unchained:core-logger';
import getCart from '../../getCart';

export default function(
  root,
  { orderId, billingAddress, contact, meta },
  { countryContext, userId }
) {
  log('mutation updateCart', { userId });
  let order = getCart({ orderId, userId, countryContext });
  if (meta) {
    order = order.updateContext(meta);
  }
  if (billingAddress) {
    order = order.updateBillingAddress(billingAddress);
  }
  if (contact) {
    order = order.updateContact({ contact });
  }
  return order;
}
