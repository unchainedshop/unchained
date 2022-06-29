import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductReviewVoteType } from '@unchainedshop/types/products.reviews';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors';

export default async function addProductReviewVote(
  root: Root,
  params: { type: ProductReviewVoteType; meta?: any; productReviewId: string },
  { modules, userId }: Context,
) {
  const { type, meta, productReviewId } = params;
  log(`mutation addProductReviewVote ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  const productReview = await modules.products.reviews.findProductReview({
    productReviewId,
  });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });

  return modules.products.reviews.votes.addVote(productReview, { meta, type }, userId);
}
