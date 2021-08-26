import crypto from 'crypto';

export default {
  total(obj, { category }) {
    const pricing = obj.pricing();
    if (pricing.isValid()) {
      const { amount, currency } = pricing.total(category);
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${obj._id}-${category}`, amount, currency].join(''))
          .digest('hex'),
        amount,
        currency,
      };
    }
    return null;
  },
  unitPrice(obj) {
    const pricing = obj.pricing();
    if (pricing.isValid()) {
      const { amount, currency } = pricing.unitPrice();
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${obj._id}-unit`, amount, currency].join(''))
          .digest('hex'),
        amount,
        currency,
      };
    }
    return null;
  },
  discounts(obj) {
    // IMPORTANT: Do not send any parameter to obj.discounts!
    return obj.discounts();
  },
};
