import { Context } from '../../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function createProductVariation(
  context: Context,
  params: Params<'CREATE_VARIATION'>,
) {
  const { modules } = context;
  const { productId, variation, variationTexts } = params;

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

  if (variationTexts) {
    await modules.products.variations.texts.updateVariationTexts(
      newVariation._id,
      variationTexts as any,
    );
  }
  return { variation: newVariation };
}
