import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default {
  async provider({ deliveryProviderId }) {
    return DeliveryProviders.findProviderById({ deliveryProviderId });
  },
};
