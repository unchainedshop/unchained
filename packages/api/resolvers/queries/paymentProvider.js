import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { InvalidIdError } from '../../errors';

export default function paymentProvider(
  root,
  { paymentProviderId },
  { userId }
) {
  log(`query paymentProvider ${paymentProviderId}`, { userId });
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  return PaymentProviders.findProvider({ paymentProviderId });
}
