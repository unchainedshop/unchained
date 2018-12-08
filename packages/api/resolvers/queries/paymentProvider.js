import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';

export default function (root, { paymentProviderId }, { userId }) {
  log(`query payment-provider ${paymentProviderId}`, { userId });
  const selector = { };
  selector._id = paymentProviderId;
  const paymentProvider = PaymentProviders.findOne(selector);
  return paymentProvider;
}
