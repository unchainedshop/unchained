import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../errors';

export default (root, { paymentProviderId, ...rest }, { userId }) => {
  log(
    `query signPaymentProviderForCredentialRegistration ${paymentProviderId}`,
    { userId }
  );
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  const paymentProvider = PaymentProviders.findProvider({ paymentProviderId });
  if (!paymentProvider)
    throw new PaymentProviderNotFoundError({ paymentProviderId });
  return paymentProvider.sign({ userId, paymentProviderId, ...rest });
};
