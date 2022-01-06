import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors';
import { ProductReviewVoteType } from '@unchainedshop/types/products.reviews';

export default async function removeProductReviewVote(
  root: Root,
  params: { productReviewId: string; type: ProductReviewVoteType },
  { modules, userId }: Context
) {
  const { productReviewId, type } = params;

  log(`mutation removeProductReviewVote ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  const productReview = await modules.products.reviews.findProductReview({
    productReviewId,
  });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });

  return await modules.products.reviews.votes.removeVote(
    productReviewId,
    { type, userId },
    userId
  );
}
