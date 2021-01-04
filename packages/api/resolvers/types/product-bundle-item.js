import { Products } from 'meteor/unchained:core-products';

export default {
  async product(productItem) {
    return Products.findProduct({ productId: productItem.productId });
  },
};
