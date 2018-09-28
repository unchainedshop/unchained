export default {
  total(obj, { category }) {
    const pricing = obj.pricing();
    if (pricing.length > 0) {
      return pricing.total(category);
    }
    return null;
  },
  unitPrice(obj) {
    const pricing = obj.pricing();
    if (pricing.length > 0) {
      return pricing.unitPrice();
    }
    return null;
  },
};
