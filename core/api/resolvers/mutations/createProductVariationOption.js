import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';

export default function (
  root, { option: inputData, productVariationId },
  { localeContext, userId },
) {
  log(`mutation createProductVariationOption ${productVariationId}`, { userId });
  const { value, title } = inputData;
  ProductVariations.update({ _id: productVariationId }, {
    $set: {
      updated: new Date(),
    },
    $addToSet: {
      options: value,
    },
  });
  const variation = ProductVariations.findOne({ _id: productVariationId });
  variation.upsertLocalizedText({
    locale: localeContext.language,
    productVariationOptionValue: value,
    title,
  });
  return variation;
}
