import { Context } from '../../../../context.js';
import { ProductVariationNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

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
