import { OrderDiscounts } from 'meteor/unchained:core-orders';
import crypto from 'crypto';

export default {
  _id(obj) {
    return `${obj.item._id}:${obj.discountId}`;
  },
  async orderDiscount(obj) {
    return OrderDiscounts.findDiscount({ discountId: obj.discountId });
  },
  total(obj) {
    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [`${obj.item._id}:${obj.discountId}`, obj.amount, obj.currency].join(
            ''
          )
        )
        .digest('hex'),
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
