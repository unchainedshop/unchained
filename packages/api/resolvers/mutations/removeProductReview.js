import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';

export default function (root, { productReviewId }, { userId }) {
  log('mutation removeProductReview', { userId, productReviewId });
  return ProductReviews.deleteReview({
    productReviewId,
  });
}
