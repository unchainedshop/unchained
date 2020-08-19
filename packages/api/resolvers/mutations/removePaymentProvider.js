import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../errors';

export default (root, { paymentProviderId }, { userId }) => {
  log(`mutation removePaymentProvider ${paymentProviderId}`, { userId });
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  const provider = PaymentProviders.findOne({ _id: paymentProviderId });
  if (!provider) throw new PaymentProviderNotFoundError({ paymentProviderId });
  return PaymentProviders.removeProvider({ _id: paymentProviderId });
};
