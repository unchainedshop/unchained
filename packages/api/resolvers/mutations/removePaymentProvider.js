import { log } from "meteor/unchained:core-logger";
import { PaymentProviders } from "meteor/unchained:core-payment";

export default (root, { paymentProviderId }, { userId }) => {
  log(`mutation removePaymentProvider ${paymentProviderId}`, { userId });
  const provider = PaymentProviders.removeProvider({ _id: paymentProviderId });
  return provider;
};
