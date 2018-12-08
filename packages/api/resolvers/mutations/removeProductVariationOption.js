import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';

export default function (root, { productVariationId, productVariationOptionValue }, { userId }) {
  log(`mutation removeProductVariation ${productVariationId}`, { userId });
  ProductVariations.update({ _id: productVariationId }, {
    $set: {
      updated: new Date(),
    },
    $pull: {
      options: productVariationOptionValue,
    },
  });
  const productVariation = ProductVariations.findOne({ _id: productVariationId });
  return productVariation;
}
