import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { InvalidIdError } from '../../../errors.js';

export default async function productReview(
  root: Root,
  { productReviewId }: { productReviewId: string },
  { modules, userId }: Context,
) {
  log(`query productReview ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  return modules.products.reviews.findProductReview({ productReviewId });
}
