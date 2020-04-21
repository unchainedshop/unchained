import { log } from 'meteor/unchained:core-logger';
import getCart from '../../getCart';

export default async function (
  root,
  {
    orderId,
    billingAddress,
    contact,
    paymentProviderId,
    deliveryProviderId,
    meta,
  },
  { user, countryContext, userId }
) {
  log('mutation updateCart', { userId });
  let order = await getCart({ orderId, user, countryContext });
  if (meta) {
    order = order.updateContext(meta);
  }
  if (billingAddress) {
    order = order.updateBillingAddress(billingAddress);
  }
  if (contact) {
    order = order.updateContact({ contact });
  }
  if (paymentProviderId) {
    order = order.setPaymentProvider({ paymentProviderId });
  }
  if (deliveryProviderId) {
    order = order.setDeliveryProvider({ deliveryProviderId });
  }
  return order;
}
