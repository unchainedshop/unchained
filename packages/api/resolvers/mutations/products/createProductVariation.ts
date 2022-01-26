import { Context, Root } from '@unchainedshop/types/api';
import {
  ProductVariation,
  ProductVariationType,
} from '@unchainedshop/types/products.variations';
import { ProductTypes } from 'meteor/unchained:core-products';
import { log } from 'meteor/unchained:logger';
import {
  InvalidIdError,
  ProductNotFoundError,
  ProductWrongTypeError,
} from '../../../errors';

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
  { modules, localeContext, userId }: Context
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

  return modules.products.variations.create(
    {
      authorId: userId,
      locale: localeContext.language,
      options: [],
      productId,
      ...variation,
    },
    userId
  );
}
