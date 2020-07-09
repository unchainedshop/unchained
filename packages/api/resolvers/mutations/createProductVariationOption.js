import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';
import { ProductVariationNotFoundError } from '../../errors';

export default function (
  root,
  { option: inputData, productVariationId },
  { localeContext, userId },
) {
  log(`mutation createProductVariationOption ${productVariationId}`, {
    userId,
  });
  if (!productVariationId)
    throw new Error('Invalid product variation ID provided');
  const variation = ProductVariations.findOne({ _id: productVariationId });
  if (!variation)
    throw new ProductVariationNotFoundError({ productVariationId });

  const { value, title } = inputData;
  ProductVariations.update(
    { _id: productVariationId },
    {
      $set: {
        updated: new Date(),
      },
      $addToSet: {
        options: value,
      },
    },
  );

  variation.upsertLocalizedText(localeContext.language, {
    productVariationOptionValue: value,
    title,
  });
  return variation;
}
