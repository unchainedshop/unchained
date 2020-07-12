import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { warehousing, productId }, { userId }) {
  log(`mutation updateProductWarehousing ${productId}`, { userId });
  if (!productId) throw new Error('Invalid product ID provided');
  const productObject = Products.updateProduct({ productId, warehousing });
  if (!productObject) throw new ProductNotFoundError({ productId });
  return productObject;
}
