import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../errors';

export default function removeBundleItem(root, { productId, index }) {
  log(`mutation removeBundleItem ${productId}`, { index });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findOne(productId);
  if (!product) throw new ProductNotFoundError({ productId });
  if (product.type !== ProductTypes.BundleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.BundleProduct,
    });
  return product.removeBundleItem({ index });
}
