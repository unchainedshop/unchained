import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { ProductVariationText } from '@unchainedshop/core-products';
import { ProductVariationNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function F(
  root: never,
  params: {
    productVariationId: string;
    productVariationOptionValue?: string;
    texts: ProductVariationText[];
  },
  { modules, userId }: Context,
) {
  const { productVariationId, productVariationOptionValue, texts } = params;

  log(`mutation updateProductVariationTexts ${productVariationId}`, { userId });

  if (!productVariationId) throw new InvalidIdError({ productVariationId });

  const productVariation = await modules.products.variations.findProductVariation({
    productVariationId,
  });
  if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

  return modules.products.variations.texts.updateVariationTexts(
    productVariationId,
    texts,
    productVariationOptionValue,
  );
}
