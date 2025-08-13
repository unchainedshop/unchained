import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function getUserReviewsCount(
  context: Context,
  params: Params<'GET_REVIEWS_COUNT'>,
) {
  const { modules } = context;
  const { userId } = params;
  return modules.products.reviews.count({
    authorId: userId,
  });
}
