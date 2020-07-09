import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError } from '../../errors';

export default function (root, { type, meta, productReviewId }, { userId }) {
  log(`mutation addProductReviewVote ${productReviewId}`, { userId });
  if (!productReviewId) throw new Error('Invalid product review ID provided ');
  const productReview = ProductReviews.findOne({ _id: productReviewId });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });
  return productReview.addVote({ type, meta, userId });
}
