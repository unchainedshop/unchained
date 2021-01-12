import { OrderDiscounts } from 'meteor/unchained:core-orders';

export default {
  _id(obj) {
    return `${obj.order._id}:${obj.discountId}`;
  },
  async orderDiscount(obj) {
    return OrderDiscounts.findDiscount({ discountId: obj.discountId });
  },
  total(obj) {
    return {
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
