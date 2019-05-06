import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';

export default (root, { paymentProvider }, { userId }) => {
  log('mutation createPaymentProvider', { userId });
  const provider = PaymentProviders.createProvider({
    authorId: userId,
    ...paymentProvider
  });
  return provider;
};
