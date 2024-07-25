import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function productReview(
  root: never,
  { productReviewId }: { productReviewId: string },
  { modules, userId }: Context,
) {
  log(`query productReview ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  return modules.products.reviews.findProductReview({ productReviewId });
}
