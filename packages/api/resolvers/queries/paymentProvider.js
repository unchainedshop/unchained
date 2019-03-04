import { log } from "meteor/unchained:core-logger";
import { PaymentProviders } from "meteor/unchained:core-payment";

export default function(root, { paymentProviderId }, { userId }) {
  log(`query payment-provider ${paymentProviderId}`, { userId });
  return PaymentProviders.findProviderById(paymentProviderId);
}
