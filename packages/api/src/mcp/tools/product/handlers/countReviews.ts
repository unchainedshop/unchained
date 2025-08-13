import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function countReviews(context: Context, params: Params<'COUNT_REVIEWS'>) {
  const { modules } = context;
  const { productId, queryString } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const count = await modules.products.reviews.count({ productId, queryString });
  return { count };
}
