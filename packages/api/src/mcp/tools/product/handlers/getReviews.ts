import type { Context } from '../../../../context.ts';
import { ProductNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function getReviews(context: Context, params: Params<'GET_REVIEWS'>) {
  const { modules } = context;
  const { productId, limit, offset, queryString, sort } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

  const reviews = await modules.products.reviews.findProductReviews({
    productId,
    limit,
    offset,
    queryString,
    sort: sortOptions,
  });
  return { reviews };
}
