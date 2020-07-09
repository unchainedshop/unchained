import { log } from 'meteor/unchained:core-logger';
import {
  ProductVariations,
  ProductVariationType,
  Products,
} from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (
  root,
  { variation: inputData, productId },
  { localeContext, userId },
) {
  log(`mutation createProductVariation ${productId}`, { userId });
  if (!productId) throw new Error('Invalid product ID provided');
  const { key, type, title } = inputData;
  const variation = { created: new Date() };
  const product = Products.findOne({ _id: productId });

  if (!product) throw new ProductNotFoundError({ productId });

  variation.key = key;
  variation.type = ProductVariationType[type];
  variation.productId = productId;
  const variationId = ProductVariations.insert(variation);
  const variationObject = ProductVariations.findOne({ _id: variationId });
  variationObject.upsertLocalizedText(localeContext.language, {
    title,
  });
  return variationObject;
}
