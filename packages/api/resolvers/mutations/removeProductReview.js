import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError, InvalidIdError } from '../../errors';

export default function removeProductReview(
  root,
  { productReviewId },
  { userId }
) {
  log('mutation removeProductReview', { userId, productReviewId });
  if (!productReviewId) throw new InvalidIdError({ productReviewId });
  if (ProductReviews.find({ _id: productReviewId }).count() === 0)
    throw new ProductReviewNotFoundError({ productReviewId });
  return ProductReviews.deleteReview({
    productReviewId,
  });
}
