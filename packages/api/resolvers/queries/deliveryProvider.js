import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default function deliveryProvider(
  root,
  { deliveryProviderId },
  { userId },
) {
  log(`query deliveryProvider ${deliveryProviderId}`, { userId });
  return DeliveryProviders.findProviderById(deliveryProviderId);
}
