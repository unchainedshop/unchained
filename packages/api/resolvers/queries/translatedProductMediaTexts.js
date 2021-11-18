import { log } from 'unchained-logger';
import { ProductMediaTexts } from 'meteor/unchained:core-products';

export default function translatedProductMediaTexts(
  root,
  { productMediaId },
  { userId }
) {
  log(`query translatedProductMediaTexts ${productMediaId}`, { userId });
  return ProductMediaTexts.findProductMediaTexts({ productMediaId });
}
