import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { productId, item }) {
  log(`mutation createProductBundleItem ${productId}`, { item });
  if (!productId) throw new Error('Invalid product ID provided');
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
