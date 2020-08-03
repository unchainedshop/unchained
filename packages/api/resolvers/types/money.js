import accounting from 'accounting';

export default {
  amount(obj) {
    if (obj.amount) {
      return accounting.toFixed(obj.amount, 0);
    }
    return 0;
  },
  currency(obj) {
    return obj.currency;
  },
};
