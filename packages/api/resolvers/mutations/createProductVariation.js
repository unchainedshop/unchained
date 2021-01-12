import { log } from 'meteor/unchained:core-logger';
import {
  ProductVariations,
  Products,
  ProductTypes,
} from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../errors';

export default function createProductVariation(
  root,
  { variation, productId },
  { localeContext, userId }
) {
  log(`mutation createProductVariation ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (product.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.ConfigurableProduct,
    });

  return ProductVariations.createVariation({
    authorId: userId,
    locale: localeContext.language,
    productId,
    ...variation,
  });
}
