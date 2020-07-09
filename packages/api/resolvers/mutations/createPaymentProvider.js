import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';

export default (root, { paymentProvider }, { userId }) => {
  log('mutation createPaymentProvider', { userId });
  return PaymentProviders.createProvider({ ...paymentProvider });
};
