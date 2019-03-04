import { log } from "meteor/unchained:core-logger";
import { Products } from "meteor/unchained:core-products";
import { Users } from "meteor/unchained:core-users";
import { Orders } from "meteor/unchained:core-orders";
import {
  ProductNotFoundError,
  UserNotFoundError,
  OrderNotFoundError,
  OrderWrongStatusError
} from "../../errors";

export default function(
  root,
  { orderId, productId, quantity, configuration },
  { userId, countryContext }
) {
  log(
    `mutation addCartProduct ${productId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ""
    }`,
    { userId, orderId }
  );
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ data: { productId } });
  if (orderId) {
    const order = Orders.findOne({ _id: orderId });
    if (!order) throw new OrderNotFoundError({ orderId });
    if (!order.isCart()) {
      throw new OrderWrongStatusError({ data: { status: order.status } });
    }
    return order.addProductItem({
      product,
      quantity,
      configuration
    });
  }
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const cart = user.initCart({ countryContext });
  return cart.addProductItem({
    product,
    quantity,
    configuration
  });
}
