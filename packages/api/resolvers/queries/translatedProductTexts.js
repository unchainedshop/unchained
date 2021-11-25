import { log } from 'meteor/unchained:logger';
import { ProductTexts } from 'meteor/unchained:core-products';

export default function translatedProductTexts(
  root,
  { productId },
  { userId }
) {
  log(`query translatedProductTexts ${productId}`, { userId });
  return ProductTexts.findProductTexts({ productId });
}
