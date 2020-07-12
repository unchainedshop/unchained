import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { texts, productId }, { userId }) {
  log(`mutation updateProductTexts ${productId}`, { userId });
  if (!productId) throw new Error('Invalid product ID provided');
  const productObject = Products.findOne({ _id: productId });
  if (!productObject) throw new ProductNotFoundError({ productId });
  const changedLocalizations = texts.map(({ locale, ...localizations }) =>
    productObject.upsertLocalizedText(locale, localizations),
  );
  return changedLocalizations;
}
