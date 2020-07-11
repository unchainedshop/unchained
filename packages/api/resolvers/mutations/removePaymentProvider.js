import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError } from '../../errors';

export default (root, { paymentProviderId }, { userId }) => {
  log(`mutation removePaymentProvider ${paymentProviderId}`, { userId });
  if (!paymentProviderId)
    throw new Error('Invalid delivery provider ID provided');
  const provider = PaymentProviders.findOne({ _id: paymentProviderId });
  if (!provider) throw new PaymentProviderNotFoundError({ paymentProviderId });
  return PaymentProviders.removeProvider({ _id: paymentProviderId });
};
