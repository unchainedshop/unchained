import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';

export default function paymentProvider(root, { type }, { userId }) {
  log(`query paymentProvider ${type}`, { userId });

  return PaymentProviders.findProviders({ type });
}
