import { log } from 'meteor/unchained:core-logger';
import getCart from '../../getCart';

export default function(
  root,
  { orderId, billingAddress, contact, meta },
  { user, countryContext, userId }
) {
  log('mutation updateCart', { userId });
  let order = getCart({ orderId, user, countryContext });
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
