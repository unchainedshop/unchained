import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../errors';

export default (root, { paymentProvider, paymentProviderId }, { userId }) => {
  log(`mutation updatePaymentProvider ${paymentProviderId}`, { userId });
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  const provider = PaymentProviders.findOne({
    _id: paymentProviderId,
    deleted: null,
  });
  if (!provider) throw new PaymentProviderNotFoundError({ paymentProviderId });
  return PaymentProviders.updateProvider({
    _id: paymentProviderId,
    ...paymentProvider,
  });
};
