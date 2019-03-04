import { Products } from "meteor/unchained:core-products";

export default {
  product(productItem) {
    return Products.findOne(productItem.productId);
  }
};
