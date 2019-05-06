import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';

export default function(
  root,
  { variation, productId },
  { localeContext, userId }
) {
  log(`mutation createProductVariation ${productId}`, { userId });
  return ProductVariations.createVariation({
    authorId: userId,
    locale: localeContext.language,
    productId,
    ...variation
  });
}
