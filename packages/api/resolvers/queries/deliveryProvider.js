import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default function (root, { deliveryProviderId }, { userId }) {
  log(`query delivery-provider ${deliveryProviderId}`, { userId });
  const selector = { };
  selector._id = deliveryProviderId;
  const deliveryProvider = DeliveryProviders.findOne(selector);
  return deliveryProvider;
}
