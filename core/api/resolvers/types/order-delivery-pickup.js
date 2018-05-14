export default {
  address(obj) {
    return obj.formattedContextValue('address');
  },
  status(obj) {
    return obj.normalizedStatus();
  },
};
