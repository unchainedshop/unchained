import { Products } from 'meteor/unchained:core-products';

export default {
  product(setItem) {
    return Products.findOne(setItem._id);
  },
};
