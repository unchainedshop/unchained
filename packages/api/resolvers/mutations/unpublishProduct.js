import { log } from 'unchained-logger';
import { Products } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function unpublishProduct(root, { productId }, { userId }) {
  log(`mutation unpublishProduct ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (!product.unpublish()) {
    throw new ProductWrongStatusError({ status: product.status });
  }

  return Products.findProduct({ productId });
}
