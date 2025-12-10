import type { Context } from '../../../../context.ts';
import { ProductNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function getProductTexts(context: Context, params: Params<'GET_PRODUCT_TEXTS'>) {
  const { modules } = context;
  const { productId } = params;
  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const texts = await modules.products.texts.findTexts({ productId });
  return { texts };
}
