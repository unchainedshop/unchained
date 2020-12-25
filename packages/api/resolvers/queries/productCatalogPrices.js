import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function productCatalogPrices(root, { productId }, { userId }) {
  log(`query productCatalogPrices ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  return product.catalogPrices();
}
