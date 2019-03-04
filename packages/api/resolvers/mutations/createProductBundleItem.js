import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';

export default function(root, { productId, item }) {
  log(`mutation createProductBundleItem ${productId}`, { item });

  Products.update(productId, {
    $set: {
      updated: new Date()
    },
    $push: {
      bundleItems: item
    }
  });

  return Products.findOne(productId);
}
