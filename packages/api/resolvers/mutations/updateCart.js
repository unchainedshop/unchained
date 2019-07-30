import { log } from 'meteor/unchained:core-logger';
import getCart from '../../getCart';

export default async function(
  root,
  { orderId, billingAddress, contact, meta },
  { user, countryContext, userId }
) {
  log('mutation updateCart', { userId });
  let order = getCart({ orderId, user, countryContext });
  if (meta) {
    order = await order.updateContext(meta);
  }
  if (billingAddress) {
    order = await order.updateBillingAddress(billingAddress);
  }
  if (contact) {
    order = await order.updateContact({ contact });
  }
  return order;
}
