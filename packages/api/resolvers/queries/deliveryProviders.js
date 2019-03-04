import { log } from "meteor/unchained:core-logger";
import { DeliveryProviders } from "meteor/unchained:core-delivery";

export default function(root, { type }, { userId }) {
  log(`query delivery-providers ${type}`, { userId });
  const deliveryProviders = DeliveryProviders.findProviders({ type });
  return deliveryProviders;
}
