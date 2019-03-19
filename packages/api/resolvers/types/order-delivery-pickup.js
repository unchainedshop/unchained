export default {
  address(obj) {
    return obj.transformedContextValue('address');
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  meta(obj) {
    return obj.transformedContextValue('meta');
  }
};
