import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { ProductReviewVoteTypeType } from '@unchainedshop/core-products';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function removeProductReviewVote(
  root: never,
  params: { productReviewId: string; type: ProductReviewVoteTypeType },
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
