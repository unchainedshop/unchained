import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import crypto from 'crypto';
import { ProductNotFoundError } from '../../errors';

export default function (root, { productId }, { userId }) {
  log(`query product ${productId}`, { userId });
  if (!productId) throw new Error('Invalid product ID provided');
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  const prices = (product.commerce && product.commerce.pricing) || [];
  return prices.map((price) => ({
    _id: crypto
      .createHash('sha256')
      .update(
        [
          productId,
          price.countryCode,
          price.currencyCode,
          price.maxQuantity,
          price.amount,
        ].join(''),
      )
      .digest('hex'),
    ...price,
  }));
}
