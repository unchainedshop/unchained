import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductVariationNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeProductVariation(
  root: Root,
  { productVariationId }: { productVariationId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeProductVariation ${productVariationId}`, { userId });

  if (!productVariationId) throw new InvalidIdError({ productVariationId });

  const productVariation = await modules.products.variations.findProductVariation({
    productVariationId,
  });
  if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

  await modules.products.variations.delete(productVariationId, userId);

  return productVariation;
}
