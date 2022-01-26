import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';

export default async function translatedProductVariationTexts(
  root: Root,
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
