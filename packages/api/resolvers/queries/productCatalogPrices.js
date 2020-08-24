import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import crypto from 'crypto';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function productCatalogPrices(root, { productId }, { userId }) {
  log(`query productCatalogPrices ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
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
