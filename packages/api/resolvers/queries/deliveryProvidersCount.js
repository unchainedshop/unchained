import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default function deliveryProvidersCount(root, { type }, { userId }) {
  log(`query deliveryProvidersCount ${type}`, { userId });

  return DeliveryProviders.count({ type });
}
