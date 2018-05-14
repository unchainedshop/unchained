import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default (root, { deliveryProviderId }, { userId }) => {
  log(`mutation removeDeliveryProvider ${deliveryProviderId}`, { userId });
  const provider = DeliveryProviders.removeProvider({ deliveryProviderId });
  return provider;
};
