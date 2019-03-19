import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import crypto from 'crypto';

export default function(root, { productId }, { userId }) {
  log(`query product ${productId}`, { userId });
  const product = Products.findOne({ _id: productId });
  const prices = (product.commerce && product.commerce.pricing) || [];
  return prices.map(price => ({
    _id: crypto
      .createHash('sha256')
      .update(
        [
          productId,
          price.countryCode,
          price.currencyCode,
          price.maxQuantity
        ].join('')
      )
      .digest('hex'),
    ...price
  }));
}
