import { log } from 'meteor/unchained:core-logger';
import { ProductVariationTexts } from 'meteor/unchained:core-products';

export default function translatedProductVariationTexts(
  root,
  { productVariationId, productVariationOptionValue },
  { userId }
) {
  log(
    `query translatedProductVariationTexts ${productVariationId} ${productVariationOptionValue}`,
    { userId }
  );
  return ProductVariationTexts.findProductVariationTexts({
    productVariationId,
    productVariationOptionValue,
  });
}
