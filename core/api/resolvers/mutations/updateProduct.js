import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../errors';

export default function (root, { product, productId }, { userId }) {
  log(`mutation updateProduct ${productId}`, { userId });
  const productObject = Products.updateProduct({ productId, ...product });
  if (!productObject) throw new ProductNotFoundError({ data: { productId } });
  return productObject;
}
