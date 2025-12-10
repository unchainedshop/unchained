import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function translatedProductVariationTexts(
  root: never,
  params: { productVariationId: string; productVariationOptionValue?: string },
  { modules, userId }: Context,
) {
  const { productVariationId, productVariationOptionValue } = params;
  log(`query translatedProductVariationTexts ${productVariationId} ${productVariationOptionValue}`, {
    userId,
  });

  return modules.products.variations.texts.findVariationTexts({
    productVariationId,
    productVariationOptionValue,
  });
}
