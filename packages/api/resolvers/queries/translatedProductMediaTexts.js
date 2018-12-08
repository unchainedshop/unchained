import { log } from 'meteor/unchained:core-logger';
import { ProductMediaTexts } from 'meteor/unchained:core-products';

export default function (root, { productMediaId }, { userId }) {
  log(`query translatedProductMediaTexts ${productMediaId}`, { userId });
  const selector = { productMediaId };
  const productTexts = ProductMediaTexts.find(selector).fetch();
  return productTexts;
}
