import { OrderDiscounts } from 'meteor/unchained:core-orders';

export default {
  _id(obj) {
    return `${obj.order._id}:${obj.discountId}`;
  },
  orderDiscount(obj) {
    return OrderDiscounts.findOne({ _id: obj.discountId });
  },
  total(obj) {
    return {
      amount: obj.amount,
      currency: obj.currency
    };
  }
};
