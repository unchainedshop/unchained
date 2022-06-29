import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductReview } from '@unchainedshop/types/products.reviews';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateProductReview(
  root: Root,
  params: { productReviewId: string; productReview: ProductReview },
  { modules, userId }: Context,
) {
  const { productReviewId, productReview } = params;

  log('mutation updateProductReview', { userId, productReviewId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  if (!(await modules.products.reviews.reviewExists({ productReviewId })))
    throw new ProductReviewNotFoundError({ productReviewId });

  return modules.products.reviews.update(productReviewId, productReview, userId);
}
