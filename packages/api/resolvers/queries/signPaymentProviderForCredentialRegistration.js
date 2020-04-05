import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError } from '../../errors';

export default (root, { paymentProviderId, ...rest }, { userId }) => {
  log(
    `query signPaymentProviderForCredentialRegistration ${paymentProviderId}`,
    { userId }
  );
  const paymentProvider = PaymentProviders.findOne({ _id: paymentProviderId });
  if (!paymentProvider)
    throw new PaymentProviderNotFoundError({ paymentProviderId });
  return paymentProvider.sign({ userId, paymentProviderId, ...rest });
};
