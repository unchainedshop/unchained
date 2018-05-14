export default {
  amount(obj) {
    if (obj.amount) {
      return Math.round((obj.amount / 20) || 0) * 20;
    }
    return 0;
  },
  currency(obj) {
    return obj.currency;
  },
};
