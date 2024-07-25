import { Context } from '../../../types.js';
import { log } from '@unchainedshop/logger';
import { VariationInputText } from '@unchainedshop/types/products.variations.js';
import { InvalidIdError, ProductVariationNotFoundError } from '../../../errors.js';

export default async function createProductVariationOption(
  root: never,
  params: {
    option: string;
    texts?: VariationInputText[];
    productVariationId: string;
  },
  { modules, userId }: Context,
) {
  const { option, productVariationId, texts } = params;

  log(`mutation createProductVariationOption ${productVariationId}`, {
    userId,
  });

  if (!productVariationId) throw new InvalidIdError({ productVariationId });

  const variation = await modules.products.variations.findProductVariation({
    productVariationId,
  });
  if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

  const newOption = await modules.products.variations.addVariationOption(productVariationId, {
    value: option,
  });

  if (texts) {
    await modules.products.variations.texts.updateVariationTexts(productVariationId, texts, option);
  }

  return newOption;
}
