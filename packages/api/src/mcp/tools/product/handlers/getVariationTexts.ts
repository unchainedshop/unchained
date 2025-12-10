import type { Context } from '../../../../context.ts';
import { ProductVariationNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function getVariationTexts(
  context: Context,
  params: Params<'GET_VARIATION_TEXTS'>,
) {
  const { modules } = context;
  const { productVariationId, productVariationOptionValue } = params;

  const variation = await modules.products.variations.findProductVariation({ productVariationId });
  if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

  const texts = await modules.products.variations.texts.findVariationTexts({
    productVariationId,
    productVariationOptionValue,
  });
  return { texts };
}
