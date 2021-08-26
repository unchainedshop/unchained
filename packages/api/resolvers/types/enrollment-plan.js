import { Products } from 'meteor/unchained:core-products';

export default {
  async product(plan) {
    return Products.findProduct({ productId: plan.productId });
  },
};
