import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, ProductReviewNotFoundError } from '../../../errors';

export default async function removeProductReview(
  root: Root,
  { productReviewId }: { productReviewId: string },
  { modules, userId }: Context
) {
  log('mutation removeProductReview', { userId, productReviewId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  if (!(await modules.products.reviews.reviewExists({ productReviewId })))
    throw new ProductReviewNotFoundError({ productReviewId });

  return await modules.products.reviews.delete(productReviewId, userId);
}
