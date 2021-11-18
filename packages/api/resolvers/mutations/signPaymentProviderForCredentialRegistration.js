import { log } from 'unchained-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../errors';

export default (root, { paymentProviderId, ...rest }, { userId }) => {
  log(
    `mutation signPaymentProviderForCredentialRegistration ${paymentProviderId}`,
    { userId }
  );
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  const paymentProvider = PaymentProviders.findProvider({ paymentProviderId });
  if (!paymentProvider)
    throw new PaymentProviderNotFoundError({ paymentProviderId });
  return paymentProvider.sign({ userId, paymentProviderId, ...rest });
};
