import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';
import { ProductVariationNotFoundError } from '../../errors';

export default function (
  root,
  { texts, productVariationId, productVariationOptionValue },
  { userId },
) {
  log(`mutation updateProductVariationTexts ${productVariationId}`, { userId });
  if (!productVariationId)
    throw new Error('Invalid product variation ID provided');
  const productVariation = ProductVariations.findOne({
    _id: productVariationId,
  });
  if (!productVariation)
    throw new ProductVariationNotFoundError({ productVariationId });
  const changedLocalizations = texts.map(({ locale, ...rest }) =>
    productVariation.upsertLocalizedText(locale, {
      productVariationOptionValue,
      ...rest,
    }),
  );
  return changedLocalizations;
}
