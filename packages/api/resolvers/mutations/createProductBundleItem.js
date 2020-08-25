import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function createProductBundleItem(root, { productId, item }) {
  log(`mutation createProductBundleItem ${productId}`, { item });
  if (!productId) throw new InvalidIdError({ productId });
  if (!item.productId)
    throw new InvalidIdError({ bundleItemId: item.productId });
  const product = Products.findOne(productId);
  if (!product) throw new ProductNotFoundError({ productId });
  const bundleProduct = Products.findOne(item.productId);
  if (!bundleProduct) throw new ProductNotFoundError({ productId });
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
