import { PaymentProviders } from 'meteor/unchained:core-payment';

export default {
  async provider(obj) {
    return PaymentProviders.findProviderById(obj.paymentProviderId);
  },
};
