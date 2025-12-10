import type { Context } from '../../../../context.ts';
import { ProductVariationNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function removeProductVariationOption(
  context: Context,
  params: Params<'REMOVE_VARIATION_OPTION'>,
) {
  const { modules } = context;
  const { productVariationId, productVariationOptionValue } = params;

  const variation = await modules.products.variations.findProductVariation({ productVariationId });
  if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

  await modules.products.variations.removeVariationOption(
    productVariationId,
    productVariationOptionValue,
  );
  return { success: true };
}
