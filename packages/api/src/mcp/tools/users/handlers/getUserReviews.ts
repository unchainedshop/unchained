import { Context } from '../../../../context.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getUserReviews(context: Context, params: Params<'GET_REVIEWS'>) {
  const { modules } = context;
  const { userId, sort, limit = 10, offset = 0 } = params;

  const reviews = await modules.products.reviews.findProductReviews({
    authorId: userId,
    offset,
    limit,
    sort,
  } as any);
  const normalizedReviews = await Promise.all(
    reviews.map(async ({ productId, ...review }) => ({
      ...(await getNormalizedProductDetails(productId, context)),
      ...review,
    })),
  );
  return { reviews: normalizedReviews };
}
