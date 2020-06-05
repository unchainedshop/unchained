import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { productId, index }) {
  log(`mutation removeBundleItem ${productId}`, { index });

  const { bundleItems = [] } = Products.findOne(productId);
  if (bundleItems.length === 0) throw new ProductNotFoundError({ productId });
  bundleItems.splice(index, 1);

  Products.update(productId, {
    $set: {
      updated: new Date(),
      bundleItems,
    },
  });

  return Products.findOne(productId);
}
