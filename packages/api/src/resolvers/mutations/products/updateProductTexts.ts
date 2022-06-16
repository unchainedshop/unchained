import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { ProductNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateProductTexts(
  root: Root,
  { texts, productId },
  { modules, userId }: Context,
) {
  log(`mutation updateProductTexts ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const productTexts = await modules.products.texts.updateTexts(productId, texts, userId);

  return productTexts;
}
