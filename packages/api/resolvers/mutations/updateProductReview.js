import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError } from '../../errors';

export default function(root, { productReviewId, productReview }, { userId }) {
  log('mutation updateProductReview', { userId, productReviewId });
  if (ProductReviews.find({ _id: productReviewId }).count() === 0)
    throw new ProductReviewNotFoundError({ productReviewId });
  return ProductReviews.updateReview({
    productReviewId,
    ...productReview
  });
}
