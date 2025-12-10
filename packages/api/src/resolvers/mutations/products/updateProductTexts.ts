import { log } from '@unchainedshop/logger';
import { ProductNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function updateProductTexts(
  root: never,
  { texts, productId },
  { modules, userId }: Context,
) {
  log(`mutation updateProductTexts ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const productTexts = await modules.products.texts.updateTexts(productId, texts);

  return productTexts;
}
