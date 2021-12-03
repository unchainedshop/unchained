import { log } from 'meteor/unchained:logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';

export default function paymentProvidersCount(root, { type }, { userId }) {
  log(`query paymentProvidersCount ${type}`, { userId });
  return PaymentProviders.count({ type });
}
