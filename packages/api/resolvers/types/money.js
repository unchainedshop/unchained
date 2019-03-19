export default {
  amount(obj) {
    if (obj.amount) {
      // http://www.jacklmoore.com/notes/rounding-in-javascript/
      return Number(`${Math.round(`${obj.amount}e0`)}e-0`);
    }
    return 0;
  },
  currency(obj) {
    return obj.currency;
  }
};
