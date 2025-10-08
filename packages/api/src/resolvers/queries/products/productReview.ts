import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductReviewNotFoundError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function productReview(
  root: never,
  { productReviewId }: { productReviewId: string },
  { modules, userId }: Context,
) {
  log(`query productReview ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });
  const review = await modules.products.reviews.findProductReview({ productReviewId });
  if (!review) throw new ProductReviewNotFoundError({ productReviewId });
  return review;
}
