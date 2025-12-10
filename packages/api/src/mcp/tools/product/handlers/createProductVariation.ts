import type { Context } from '../../../../context.ts';
import { ProductType } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';

export default async function createProductVariation(
  context: Context,
  params: Params<'CREATE_VARIATION'>,
) {
  const { modules } = context;
  const { productId, variation, variationTexts } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductType.CONFIGURABLE_PRODUCT)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductType.CONFIGURABLE_PRODUCT,
    });

  const newVariation = await modules.products.variations.create({
    options: [],
    tags: [],
    productId,
    ...variation,
  });

  if (variationTexts) {
    await modules.products.variations.texts.updateVariationTexts(
      newVariation._id,
      variationTexts as any,
    );
  }
  return { product: await getNormalizedProductDetails(productId, context) };
}
