import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default function (root, { deliveryProvider, deliveryProviderId }, { userId }) {
  log(`mutation updateDeliveryProvider ${deliveryProviderId}`, { userId });
  const provider = DeliveryProviders.updateProvider({
    deliveryProviderId,
    ...deliveryProvider,
  });
  return provider;
}
