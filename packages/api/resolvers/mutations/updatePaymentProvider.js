import { log } from "meteor/unchained:core-logger";
import { PaymentProviders } from "meteor/unchained:core-payment";

export default (root, { paymentProvider, paymentProviderId }, { userId }) => {
  log(`mutation updatePaymentProvider ${paymentProviderId}`, { userId });
  const provider = PaymentProviders.updateProvider({
    _id: paymentProviderId,
    ...paymentProvider
  });
  return provider;
};
