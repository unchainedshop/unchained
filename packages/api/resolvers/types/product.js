import { ProductTypes } from "meteor/unchained:core-products";
import { objectInvert } from "meteor/unchained:utils";

export default {
  __resolveType(obj) {
    const invertedProductTypes = objectInvert(ProductTypes);
    return invertedProductTypes[obj.type];
  }
};
