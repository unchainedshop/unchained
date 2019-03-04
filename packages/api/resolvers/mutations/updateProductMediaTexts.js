import { log } from 'meteor/unchained:core-logger';
import { ProductMedia } from 'meteor/unchained:core-products';

export default function(root, { texts, productMediaId }, { userId }) {
  log(`mutation updateProductMediaTexts ${productMediaId}`, { userId });
  const productMediaObject = ProductMedia.findOne({ _id: productMediaId });
  const changedLocalizations = texts.map(({ locale, ...rest }) =>
    productMediaObject.upsertLocalizedText({ locale, ...rest })
  );
  return changedLocalizations;
}
