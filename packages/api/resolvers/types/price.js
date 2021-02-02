export default {
  isTaxable({ isTaxable }) {
    return isTaxable || false;
  },
  isNetPrice({ isNetPrice }) {
    return isNetPrice || false;
  },
  currency({ currencyCode }) {
    return currencyCode;
  },
  amount({ amount }) {
    return Math.round(amount);
  },
};
