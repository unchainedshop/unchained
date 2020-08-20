import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function (root, { productId }, { userId }) {
  log(`mutation unpublishProduct ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (!product.unpublish()) {
    throw new ProductWrongStatusError({ status: product.status });
  }

  return Products.findOne({ _id: productId });
}
