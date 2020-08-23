import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';

export default function removeProductVariation(
  root,
  { productVariationId },
  { userId },
) {
  log(`mutation removeProductVariation ${productVariationId}`, { userId });
  const productVariation = ProductVariations.findOne({
    _id: productVariationId,
  });
  ProductVariations.remove({ _id: productVariationId });
  return productVariation;
}
