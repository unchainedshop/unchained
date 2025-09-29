import { ProductVariation } from '@unchainedshop/core-products';
import { Context } from '../../../../context.js';
import { ProductVariationNotFoundError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function addProductVariationOption(
  context: Context,
  params: Params<'ADD_VARIATION_OPTION'>,
) {
  const { modules } = context;
  const { productVariationId, option, variationTexts } = params;

  const variation = await modules.products.variations.findProductVariation({ productVariationId });
  if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

  const newOption = (await modules.products.variations.addVariationOption(productVariationId, {
    value: option,
  })) as ProductVariation;

  if (variationTexts && variationTexts.length > 0) {
    await modules.products.variations.texts.updateVariationTexts(
      productVariationId,
      variationTexts as any[],
      option,
    );
  }
  return { product: await getNormalizedProductDetails(newOption.productId, context) };
}
