import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { productId, index }) {
  log(`mutation removeBundleItem ${productId}`, { index });
  const product = Products.findOne(productId);
  if (!product) throw new ProductNotFoundError({ productId });
  const { bundleItems = [] } = product;
  bundleItems.splice(index, 1);

  Products.update(productId, {
    $set: {
      updated: new Date(),
      bundleItems,
    },
  });

  return Products.findOne(productId);
}
