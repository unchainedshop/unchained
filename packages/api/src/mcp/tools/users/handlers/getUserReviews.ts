import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function getUserReviews(context: Context, params: Params<'GET_REVIEWS'>) {
  const { modules } = context;
  const { userId, sort, limit = 10, offset = 0 } = params;

  return modules.products.reviews.findProductReviews({
    authorId: userId,
    offset,
    limit,
    sort,
  });
}
