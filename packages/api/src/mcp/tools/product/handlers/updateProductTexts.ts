import type { Context } from '../../../../context.ts';
import { ProductNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function updateProductTexts(
  context: Context,
  params: Params<'UPDATE_PRODUCT_TEXTS'>,
) {
  const { modules } = context;
  const { productId, texts } = params;
  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const productTexts = await modules.products.texts.updateTexts(productId, texts as any);
  return { texts: productTexts };
}
