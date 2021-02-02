export default {
  isTaxable({ isTaxable }) {
    return isTaxable || false;
  },
  isNetPrice({ isNetPrice }) {
    return isNetPrice || false;
  },
  currency(obj) {
    return obj?.currencyCode || obj?.currency;
  },
  amount({ amount }) {
    return Math.round(amount);
  },
};
