import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';

export default function updateProductTexts(
  root,
  { texts, productId },
  { userId },
) {
  log(`mutation updateProductTexts ${productId}`, { userId });
  const product = Products.findOne({ _id: productId });
  const changedLocalizations = texts.map(({ locale, ...localizations }) =>
    product.upsertLocalizedText(locale, {
      authorId: userId,
      localizations,
    }),
  );
  return changedLocalizations;
}
