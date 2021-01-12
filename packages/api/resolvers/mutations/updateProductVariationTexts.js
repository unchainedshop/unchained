import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';
import { ProductVariationNotFoundError, InvalidIdError } from '../../errors';

export default function updateProductVariationTexts(
  root,
  { texts, productVariationId, productVariationOptionValue },
  { userId }
) {
  log(`mutation updateProductVariationTexts ${productVariationId}`, { userId });
  if (!productVariationId) throw new InvalidIdError({ productVariationId });
  const productVariation = ProductVariations.findVariation({
    productVariationId,
  });
  if (!productVariation)
    throw new ProductVariationNotFoundError({ productVariationId });
  return productVariation.updateTexts({
    texts,
    productVariationOptionValue,
    userId,
  });
}
