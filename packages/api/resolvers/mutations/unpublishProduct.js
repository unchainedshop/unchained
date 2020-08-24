import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, ProductWrongStatusError } from '../../errors';

export default function unpublishProduct(root, { productId }, { userId }) {
  log(`mutation unpublishProduct ${productId}`, { userId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (!product.unpublish()) {
    throw new ProductWrongStatusError({ status: product.status });
  }

  return Products.findOne({ _id: productId });
}
