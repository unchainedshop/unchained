import { log } from 'meteor/unchained:logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../../errors';

export default async function removeBundleItem(root: Root, { productId, index }) {
  log(`mutation removeBundleItem ${productId}`, { index });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (product.type !== ProductTypes.BundleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.BundleProduct,
    });
  Products.removeBundleItem({ productId, index });
  return Products.findProduct({ productId });
}
