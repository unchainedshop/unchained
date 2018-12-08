import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../errors';

export default function (root, { supply, productId }, { userId }) {
  log(`mutation updateProductSupply ${productId}`, { userId });
  const productObject = Products.updateProduct({ productId, supply });
  if (!productObject) throw new ProductNotFoundError({ data: { productId } });
  return productObject;
}
