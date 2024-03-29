import { Context, Root } from '@unchainedshop/types/api.js';
import { ProductVariationType } from '@unchainedshop/types/products.variations.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';

export default async function F(
  root: Root,
  params: {
    productId: string;
    variation: {
      key: string;
      type: ProductVariationType;
      title: string;
    };
  },
  { modules, localeContext, userId }: Context,
) {
  const { variation, productId } = params;

  log(`mutation createProductVariation ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.ConfigurableProduct,
    });

  return modules.products.variations.create({
    locale: localeContext.language,
    options: [],
    productId,
    ...variation,
  });
}
