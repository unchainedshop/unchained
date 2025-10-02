import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

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
