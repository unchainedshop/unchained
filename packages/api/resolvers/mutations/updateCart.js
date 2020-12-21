import { log } from 'meteor/unchained:core-logger';
import getCart from '../../getCart';

export default async function updateCart(
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

  const order = await getCart({ orderId, user, countryContext });

  return order.updateCart({
    billingAddress,
    contact,
    paymentProviderId,
    deliveryProviderId,
    meta,
  });
}
