import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError, InvalidIdError } from '../../errors';

export default function addProductReviewVote(
  root,
  { type, meta, productReviewId },
  { userId }
) {
  log(`mutation addProductReviewVote ${productReviewId}`, { userId });
  if (!productReviewId) throw new InvalidIdError({ productReviewId });
  const productReview = ProductReviews.findReview({ productReviewId });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });
  return productReview.addVote({ type, meta, userId });
}
