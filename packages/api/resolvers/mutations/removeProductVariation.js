import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';
import { ProductVariationNotFoundError, InvalidIdError } from '../../errors';

export default function removeProductVariation(
  root,
  { productVariationId },
  { userId }
) {
  log(`mutation removeProductVariation ${productVariationId}`, { userId });
  if (!productVariationId) throw new InvalidIdError({ productVariationId });
  const productVariation = ProductVariations.findVariation({
    productVariationId,
  });
  if (!productVariation)
    throw new ProductVariationNotFoundError({ productVariationId });
  ProductVariations.removeVariation({ productVariationId });
  return productVariation;
}
