import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default {
  async provider(obj) {
    return DeliveryProviders.findProviderById(obj.deliveryProviderId);
  },
};
