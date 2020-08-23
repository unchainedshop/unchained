import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError } from '../../errors';

export default function addProductReviewVote(
  root,
  { type, meta, productReviewId },
  { userId },
) {
  log(`mutation addProductReviewVote ${productReviewId}`, { userId });
  const productReview = ProductReviews.findOne({ _id: productReviewId });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });
  return productReview.addVote({ type, meta, userId });
}
