import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function publishProduct(root, { productId }, { userId }) {
  log(`mutation publishProduct ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (!product.publish()) {
    throw new ProductWrongStatusError({ status: product.status });
  }

  return Products.findProduct({ productId });
}
