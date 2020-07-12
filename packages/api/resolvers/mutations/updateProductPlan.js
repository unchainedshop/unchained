import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { plan, productId }, { userId }) {
  log(`mutation updateProductPlan ${productId}`, { userId });
  if (!productId) throw new Error('invalid product ID provided');
  const productObject = Products.updateProduct({ productId, plan });
  if (!productObject) throw new ProductNotFoundError({ productId });
  return productObject;
}
