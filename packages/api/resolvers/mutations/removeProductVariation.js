import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';
import { ProductVariationNotFoundError } from '../../errors';

export default function (root, { productVariationId }, { userId }) {
  log(`mutation removeProductVariation ${productVariationId}`, { userId });
  if (!productVariationId)
    throw new Error('Invalid product variation ID provided');
  const productVariation = ProductVariations.findOne({
    _id: productVariationId,
  });
  if (!productVariation)
    throw new ProductVariationNotFoundError({ productVariationId });
  ProductVariations.remove({ _id: productVariationId });
  return productVariation;
}
