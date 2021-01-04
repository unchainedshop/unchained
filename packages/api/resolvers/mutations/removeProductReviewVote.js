import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError, InvalidIdError } from '../../errors';

export default function removeProductReviewVote(
  root,
  { type, productReviewId },
  { userId }
) {
  log(`mutation removeProductReviewVote ${productReviewId}`, { userId });
  if (!productReviewId) throw new InvalidIdError({ productReviewId });
  const productReview = ProductReviews.findReview({ productReviewId });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });
  return productReview.removeVote({ type, userId });
}
