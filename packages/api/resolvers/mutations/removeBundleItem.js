import { log } from "meteor/unchained:core-logger";
import { Products } from "meteor/unchained:core-products";

export default function(root, { productId, index }) {
  log(`mutation removeBundleItem ${productId}`, { index });

  const { bundleItems = [] } = Products.findOne(productId);
  bundleItems.splice(index, 1);
  Products.update(productId, {
    $set: {
      updated: new Date(),
      bundleItems
    }
  });

  return Products.findOne(productId);
}
