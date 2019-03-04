import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';

export default function(root, { productReviewId, productReview }, { userId }) {
  log('mutation updateProductReview', { userId, productReviewId });
  return ProductReviews.updateReview({
    productReviewId,
    ...productReview
  });
}
