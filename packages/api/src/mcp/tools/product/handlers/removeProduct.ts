import { Context } from '../../../../context.js';
import { ProductNotFoundError, ProductWrongStatusError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function removeProduct(context: Context, params: Params<'REMOVE'>) {
  const { modules } = context;
  const { productId } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.status !== 'DRAFT') {
    throw new ProductWrongStatusError({ productId, status: product.status });
  }

  const result = await modules.products.delete(productId);
  return { success: Boolean(result) };
}
