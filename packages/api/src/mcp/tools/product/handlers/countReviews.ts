import type { Context } from '../../../../context.ts';
import { ProductNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function countReviews(context: Context, params: Params<'COUNT_REVIEWS'>) {
  const { modules } = context;
  const { productId } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const count = await modules.products.reviews.count({ productId });
  return { count };
}
