import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function getProductTexts(context: Context, params: Params<'GET_PRODUCT_TEXTS'>) {
  const { modules } = context;
  const { productId } = params;
  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const texts = await modules.products.texts.findTexts({ productId });
  return { texts };
}
