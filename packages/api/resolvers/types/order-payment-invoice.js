export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  discounts(obj) {
    // IMPORTANT: Do not send any parameter to obj.discounts!
    return obj.discounts();
  },
};
