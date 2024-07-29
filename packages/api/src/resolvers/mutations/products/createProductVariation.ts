import { Context, VariationInputText } from '../../../types.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';
import { ProductVariationType } from '@unchainedshop/core-products';

export default async function F(
  root: never,
  params: {
    productId: string;
    variation: {
      key: string;
      type: ProductVariationType;
    };
    texts?: VariationInputText[];
  },
  { modules, userId }: Context,
) {
  const { variation, productId, texts } = params;

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

  const newVariation = await modules.products.variations.create({
    options: [],
    productId,
    ...variation,
  });

  if (texts) {
    await modules.products.variations.texts.updateVariationTexts(newVariation._id, texts);
  }

  return newVariation;
}
