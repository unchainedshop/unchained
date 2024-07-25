import { Context } from '../../../types.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductReviewNotFoundError } from '../../../errors.js';

export default async function removeProductReview(
  root: never,
  { productReviewId }: { productReviewId: string },
  { modules, userId }: Context,
) {
  log('mutation removeProductReview', { userId, productReviewId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  if (!(await modules.products.reviews.reviewExists({ productReviewId })))
    throw new ProductReviewNotFoundError({ productReviewId });

  await modules.products.reviews.delete(productReviewId);

  return modules.products.reviews.findProductReview({
    productReviewId,
  });
}
