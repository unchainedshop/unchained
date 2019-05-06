import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';

export default function(
  root,
  { texts, productVariationId, productVariationOptionValue },
  { userId }
) {
  log(`mutation updateProductVariationTexts ${productVariationId}`, { userId });
  const productVariation = ProductVariations.findOne({
    _id: productVariationId
  });
  const changedLocalizations = texts.map(({ locale, ...localizations }) =>
    productVariation.upsertLocalizedText(locale, {
      authorId: userId,
      productVariationOptionValue,
      ...localizations
    })
  );
  return changedLocalizations;
}
