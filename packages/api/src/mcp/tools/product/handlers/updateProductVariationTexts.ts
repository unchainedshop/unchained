import { Context } from '../../../../context.js';
import { ProductVariationNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function updateProductVariationTexts(
  context: Context,
  params: Params<'UPDATE_VARIATION_TEXTS'>,
) {
  const { modules } = context;
  const { productVariationId, variationTexts, productVariationOptionValue } = params;

  const variation = await modules.products.variations.findProductVariation({ productVariationId });
  if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

  const texts = await modules.products.variations.texts.updateVariationTexts(
    productVariationId,
    variationTexts as any,
    productVariationOptionValue,
  );

  return { texts };
}
