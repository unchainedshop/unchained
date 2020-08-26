import { log } from 'meteor/unchained:core-logger';
import { ProductMediaTexts } from 'meteor/unchained:core-products';

export default function translatedProductMediaTexts(
  root,
  { productMediaId },
  { userId },
) {
  log(`query translatedProductMediaTexts ${productMediaId}`, { userId });

  const selector = { productMediaId };
  return ProductMediaTexts.find(selector).fetch();
}
