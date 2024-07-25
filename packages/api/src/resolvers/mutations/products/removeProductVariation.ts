import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { ProductVariationNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function removeProductVariation(
  root: never,
  { productVariationId }: { productVariationId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeProductVariation ${productVariationId}`, { userId });

  if (!productVariationId) throw new InvalidIdError({ productVariationId });

  const productVariation = await modules.products.variations.findProductVariation({
    productVariationId,
  });
  if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

  await modules.products.variations.delete(productVariationId);

  return productVariation;
}
