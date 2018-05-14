export default {
  total(obj, { category }) {
    return obj.pricing().total(category);
  },
  unitPrice(obj) {
    return obj.pricing().unitPrice();
  },
};
