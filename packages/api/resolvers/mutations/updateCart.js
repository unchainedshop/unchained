import { log } from "meteor/unchained:core-logger";
import { Users } from "meteor/unchained:core-users";
import { Orders } from "meteor/unchained:core-orders";
import {
  UserNotFoundError,
  OrderNotFoundError,
  OrderWrongStatusError
} from "../../errors";

export default function(
  root,
  { orderId, billingAddress, contact, meta },
  { countryContext, userId }
) {
  log("mutation updateCart", { userId });
  let order;
  if (orderId) {
    order = Orders.findOne({ _id: orderId });
    if (!order) throw new OrderNotFoundError({ data: { orderId } });
    if (!order.isCart()) {
      throw new OrderWrongStatusError({ data: { status: order.status } });
    }
  } else {
    const user = Users.findOne({ _id: userId });
    if (!user) throw new UserNotFoundError({ userId });
    order = user.initCart({ countryContext });
  }

  if (meta) {
    order = order.updateContext(meta);
  }
  if (billingAddress) {
    order = order.updateBillingAddress(billingAddress);
  }
  if (contact) {
    order = order.updateContact({ contact });
  }
  return order;
}
