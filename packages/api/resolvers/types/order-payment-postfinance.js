export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  meta(obj) {
    return obj.transformedContextValue("meta");
  }
};
