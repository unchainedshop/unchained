import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { ProductReviewVoteTypeType } from '@unchainedshop/core-products';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function addProductReviewVote(
  root: never,
  params: { type: ProductReviewVoteTypeType; meta?: any; productReviewId: string },
  { modules, userId }: Context,
) {
  const { type, meta, productReviewId } = params;
  log(`mutation addProductReviewVote ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  const productReview = await modules.products.reviews.findProductReview({
    productReviewId,
  });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });

  return modules.products.reviews.votes.addVote(productReview, { meta, type, userId: userId! });
}
