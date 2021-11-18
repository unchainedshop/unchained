import { log } from 'unchained-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default function deliveryInterfaces(root, { type }, { userId }) {
  log(`query deliveryInterfaces ${type}`, { userId });
  return DeliveryProviders.findInterfaces({ type });
}
