import { log } from "meteor/unchained:core-logger";
import { PaymentProviders } from "meteor/unchained:core-payment";

export default function(root, { type }, { userId }) {
  log(`query payment-providers ${type}`, { userId });
  return PaymentProviders.findProviders({ type });
}
