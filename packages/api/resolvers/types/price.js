import accounting from 'accounting';

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
  amount(obj) {
    if (obj.amount) {
      return accounting.toFixed(obj.amount, 0);
    }
    return 0;
  },
};
