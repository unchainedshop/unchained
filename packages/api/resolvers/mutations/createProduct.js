import { log } from 'unchained-logger';
import { Products } from 'meteor/unchained:core-products';

export default function createProduct(
  root,
  { product },
  { userId, localeContext }
) {
  log('mutation createProduct', { userId });
  return Products.createProduct({
    ...product,
    authorId: userId,
    locale: localeContext.language,
  });
}
