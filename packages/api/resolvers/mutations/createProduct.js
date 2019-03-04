import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';

export default function(root, { product }, { userId, localeContext }) {
  log('mutation createProduct', { userId });
  return Products.createProduct({
    locale: localeContext.language,
    authorId: userId,
    ...product
  });
}
