import { log } from "meteor/unchained:core-logger";
import { Orders } from "meteor/unchained:core-orders";

export default function(root, { orderId }, { userId }) {
  log(`query order ${orderId}`, { userId, orderId });
  const selector = { _id: orderId };
  return Orders.findOne(selector);
}
