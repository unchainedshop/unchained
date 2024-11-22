import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { ProductReview } from '@unchainedshop/core-products';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function updateProductReview(
  root: never,
  params: { productReviewId: string; productReview: ProductReview },
  { modules, userId }: Context,
) {
  const { productReviewId, productReview } = params;

  log('mutation updateProductReview', { userId, productReviewId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  if (!(await modules.products.reviews.reviewExists({ productReviewId })))
    throw new ProductReviewNotFoundError({ productReviewId });

  return modules.products.reviews.update(productReviewId, productReview);
}
