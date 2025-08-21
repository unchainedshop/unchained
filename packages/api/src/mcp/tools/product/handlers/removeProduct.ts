import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function removeProduct(context: Context, params: Params<'REMOVE'>) {
  const { modules } = context;
  const { productId } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  await modules.products.delete(productId);
  return { success: true };
}
