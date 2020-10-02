import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError, InvalidIdError } from '../../errors';

export default function updateProductReview(
  root,
  { productReviewId, productReview },
  { userId }
) {
  log('mutation updateProductReview', { userId, productReviewId });
  if (!productReviewId) throw new InvalidIdError({ productReviewId });
  if (ProductReviews.find({ _id: productReviewId }).count() === 0)
    throw new ProductReviewNotFoundError({ productReviewId });
  return ProductReviews.updateReview({
    productReviewId,
    ...productReview,
  });
}
