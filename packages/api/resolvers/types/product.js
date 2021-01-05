import { ProductTypes } from 'meteor/unchained:core-products';
import { objectInvert } from 'meteor/unchained:utils';
import crypto from 'crypto';

export default {
  __resolveType(obj) {
    const invertedProductTypes = objectInvert(ProductTypes);
    return invertedProductTypes[obj.type];
  },
  async catalogPrices(obj) {
    const prices = (obj.commerce && obj.commerce.pricing) || [];
    return prices.map((price) => ({
      _id: crypto
        .createHash('sha256')
        .update(
          [
            obj._id,
            price.countryCode,
            price.currencyCode,
            price.maxQuantity,
            price.amount,
          ].join('')
        )
        .digest('hex'),
      ...price,
    }));
  },
};
