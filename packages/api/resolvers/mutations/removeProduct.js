import { log } from 'meteor/unchained:core-logger';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function removeProduct(root, { productId }, { userId }) {
  log(`mutation removeProduct ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (product.status !== ProductStatus.DRAFT)
    throw new ProductWrongStatusError({ status: product.status });
  Products.removeProduct({ productId });
  return Products.findProduct({ productId });
}
