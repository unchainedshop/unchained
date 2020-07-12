import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { commerce, productId }, { userId }) {
  log(`mutation updateProductCommerce ${productId}`, { userId });
  if (!productId) throw new Error('Invalid product ID provided');
  const productObject = Products.updateProduct({ productId, commerce });
  if (!productObject) throw new ProductNotFoundError({ productId });
  return productObject;
}
