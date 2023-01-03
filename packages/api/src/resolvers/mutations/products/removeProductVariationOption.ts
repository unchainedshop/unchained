import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidIdError, ProductVariationNotFoundError } from '../../../errors.js';

export default async function removeProductVariationOption(
  root: Root,
  params: { productVariationId: string; productVariationOptionValue: string },
  { modules, userId }: Context,
) {
  const { productVariationId, productVariationOptionValue } = params;

  log(`mutation removeProductVariationOption ${productVariationId} ${productVariationOptionValue}`, {
    userId,
  });

  if (!productVariationId) throw new InvalidIdError({ productVariationId });

  const productVariation = await modules.products.variations.findProductVariation({
    productVariationId,
  });
  if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

  await modules.products.variations.removeVariationOption(
    productVariationId,
    productVariationOptionValue,
  );

  return modules.products.variations.findProductVariation({
    productVariationId,
  });
}
