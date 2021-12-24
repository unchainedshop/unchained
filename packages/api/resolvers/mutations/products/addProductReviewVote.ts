import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors';
import { ProductReviewVoteType } from '@unchainedshop/types/products.reviews';

export default async function addProductReviewVote(
  root: Root,
  params: { type: ProductReviewVoteType; meta?: any; productReviewId: string },
  { modules, userId }: Context
) {
  const { type, meta, productReviewId } = params;
  log(`mutation addProductReviewVote ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  const productReview = await modules.products.reviews.findProductReview({
    productReviewId,
  });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });

  return await modules.products.reviews.votes.add(
    productReviewId,
    { meta, type },
    userId
  );
}
