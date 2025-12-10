import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { ProductReview } from '@unchainedshop/core-products';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors.ts';

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
