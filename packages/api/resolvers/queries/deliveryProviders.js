import { log } from 'unchained-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default function deliveryProviders(root, { type }, { userId }) {
  log(`query deliveryProviders ${type}`, { userId });

  return DeliveryProviders.findProviders({ type });
}
