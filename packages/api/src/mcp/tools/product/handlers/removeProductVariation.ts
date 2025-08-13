import { Context } from '../../../../context.js';
import { ProductVariationNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

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
