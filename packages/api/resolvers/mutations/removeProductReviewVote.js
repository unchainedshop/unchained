import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError } from '../../errors';

export default function (root, { type, productReviewId }, { userId }) {
  log(`mutation removeProductReviewVote ${productReviewId}`, { userId });
  if (!productReviewId)
    throw new Error('invalid product review vote ID provided');
  const productReview = ProductReviews.findOne({ _id: productReviewId });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });
  return productReview.removeVote({ type, userId });
}
