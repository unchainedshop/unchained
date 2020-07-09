import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default (root, { deliveryProvider }, { userId }) => {
  log('mutation createDeliveryProvider', { userId });
  return DeliveryProviders.createProvider({ ...deliveryProvider });
};
