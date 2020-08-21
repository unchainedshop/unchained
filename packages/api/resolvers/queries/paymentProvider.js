import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { paymentProviderId }, { userId }) {
  log(`query payment-provider ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  const provider = PaymentProviders.findProviderById(paymentProviderId);
  if (!provider) throw new PaymentProviderNotFoundError({ paymentProviderId });

  return provider;
}
