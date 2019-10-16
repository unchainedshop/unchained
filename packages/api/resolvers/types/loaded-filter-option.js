export default {
  // Deprecated
  remaining(obj) {
    return obj.filteredProducts;
  },
  // Deprecated
  option(obj) {
    return obj.definition();
  },
  // Deprecated
  active(obj) {
    return obj.isSelected;
  }
};
