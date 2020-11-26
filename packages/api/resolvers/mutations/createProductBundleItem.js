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
  const product = Products.findOne(productId);

  const bundleProduct = Products.findOne(item.productId);
  if (!bundleProduct) throw new ProductNotFoundError({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (bundleProduct.type !== ProductTypes.BundleProduct)
    throw new ProductWrongTypeError({
      productId,
      recieved: bundleProduct.type,
      required: ProductTypes.BundleProduct,
    });
  Products.update(productId, {
    $set: {
      updated: new Date(),
    },
    $push: {
      bundleItems: item,
    },
  });

  return product;
}
