import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';

export default function (root, { type }, { userId }) {
  log(`query payment-providers ${type}`, { userId });
  const selector = {};
  if (type) {
    selector.type = type;
  }
  const paymentProviders = PaymentProviders.find(selector).fetch();
  return paymentProviders;
}
