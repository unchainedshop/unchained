import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';

import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../errors';

export default function createProductBundleItem(root, { productId, item }) {
  log(`mutation createProductBundleItem ${productId}`, { item });

  if (!productId) throw new InvalidIdError({ productId });
  if (!item.productId)
    throw new InvalidIdError({ bundleItemId: item.productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (product.type !== ProductTypes.BundleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.BundleProduct,
    });
  const bundleItem = Products.findProduct({ productId: item.productId });
  if (!bundleItem)
    throw new ProductNotFoundError({ productId: item.productId });

  Products.createBundleItem({ productId, item });
  return Products.findProduct({ productId });
}
