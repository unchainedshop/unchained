import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';
import { ProductVariationNotFoundError, InvalidIdError } from '../../errors';

export default function updateProductVariationTexts(
  root,
  { texts, productVariationId, productVariationOptionValue },
  { userId },
) {
  log(`mutation updateProductVariationTexts ${productVariationId}`, { userId });
  if (!productVariationId) throw new InvalidIdError({ productVariationId });
  const productVariation = ProductVariations.findOne({
    _id: productVariationId,
  });
  if (!productVariation)
    throw new ProductVariationNotFoundError({ productVariationId });
  const changedLocalizations = texts.map(({ locale, ...localizations }) =>
    productVariation.upsertLocalizedText(locale, {
      authorId: userId,
      productVariationOptionValue,
      ...localizations,
    }),
  );
  return changedLocalizations;
}
