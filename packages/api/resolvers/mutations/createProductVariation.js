import { log } from 'meteor/unchained:core-logger';
import {
  ProductVariations,
  ProductVariationType
} from 'meteor/unchained:core-products';

export default function(
  root,
  { variation: inputData, productId },
  { localeContext, userId }
) {
  log(`mutation createProductVariation ${productId}`, { userId });
  const { key, type, title } = inputData;
  const variation = { created: new Date() };
  variation.key = key;
  variation.type = ProductVariationType[type];
  variation.productId = productId;
  const variationId = ProductVariations.insert(variation);
  const variationObject = ProductVariations.findOne({ _id: variationId });
  variationObject.upsertLocalizedText(localeContext.language, {
    title
  });
  return variationObject;
}
