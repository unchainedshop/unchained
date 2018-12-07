import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default function (root, { type }, { userId }) {
  log(`query delivery-providers ${type}`, { userId });
  const selector = {};
  if (type) {
    selector.type = type;
  }
  const deliveryProviders = DeliveryProviders.find(selector).fetch();
  return deliveryProviders;
}
