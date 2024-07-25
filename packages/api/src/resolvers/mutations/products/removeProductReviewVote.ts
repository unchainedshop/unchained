import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { ProductReviewVoteType } from '@unchainedshop/types/products.reviews.js';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function removeProductReviewVote(
  root: never,
  params: { productReviewId: string; type: ProductReviewVoteType },
  { modules, userId }: Context,
) {
  const { productReviewId, type } = params;

  log(`mutation removeProductReviewVote ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  const productReview = await modules.products.reviews.findProductReview({
    productReviewId,
  });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });

  return modules.products.reviews.votes.removeVote(productReviewId, { type, userId });
}
