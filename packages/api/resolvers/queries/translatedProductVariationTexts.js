import { log } from 'meteor/unchained:core-logger';
import { ProductVariationTexts } from 'meteor/unchained:core-products';

export default function (
  root,
  { productVariationId, productVariationOptionValue },
  { userId },
) {
  log(
    `query translatedProductVariationTexts ${productVariationId} ${productVariationOptionValue}`,
    { userId },
  );
  const selector = {
    productVariationId,
    productVariationOptionValue,
  };
  const productTexts = ProductVariationTexts.find(selector).fetch();
  return productTexts;
}
