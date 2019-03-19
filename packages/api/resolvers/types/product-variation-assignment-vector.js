export default {
  _id({ product, key, value }) {
    return `${product._id}:${key}=${value}}`;
  },
  option(obj) {
    return obj.product.variation(obj.key).optionObject(obj.value);
  },
  variation(obj) {
    return obj.product.variation(obj.key);
  }
};
