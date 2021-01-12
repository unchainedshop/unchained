import { PaymentProviders } from 'meteor/unchained:core-payment';

export default {
  async provider({ paymentProviderId }) {
    return PaymentProviders.findProvider({ paymentProviderId });
  },
};
