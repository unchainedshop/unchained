import type { Context } from '../../../../context.ts';
import { ProductVariationNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function removeProductVariation(
  context: Context,
  params: Params<'REMOVE_VARIATION'>,
) {
  const { modules } = context;
  const { productVariationId } = params;

  const variation = await modules.products.variations.findProductVariation({ productVariationId });
  if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

  await modules.products.variations.delete(productVariationId);

  return { success: true };
}
