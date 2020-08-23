import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';

export default function paymentProvider(
  root,
  { paymentProviderId },
  { userId },
) {
  log(`query paymentProvider ${paymentProviderId}`, { userId });
  return PaymentProviders.findProviderById(paymentProviderId);
}
