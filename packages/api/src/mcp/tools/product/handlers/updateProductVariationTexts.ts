import type { Context } from '../../../../context.ts';
import { ProductVariationNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

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
