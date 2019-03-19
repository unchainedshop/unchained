import { log } from 'meteor/unchained:core-logger';
import { ProductTexts } from 'meteor/unchained:core-products';

export default function(root, { productId }, { userId }) {
  log(`query translatedProductTexts ${productId}`, { userId });
  const selector = { productId };
  const productTexts = ProductTexts.find(selector).fetch();
  return productTexts;
}
