import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError } from '../../errors';

export default function (root, { productReviewId }, { userId }) {
  log('mutation removeProductReview', { userId, productReviewId });
  if (ProductReviews.find({ _id: productReviewId }).count() === 0)
    throw new ProductReviewNotFoundError({ productReviewId });
  return ProductReviews.deleteReview({
    productReviewId,
  });
}
