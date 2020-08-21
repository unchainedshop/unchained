import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { productReviewId }, { userId }) {
  log(`query productReview ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  const review = ProductReviews.findReviewById(productReviewId);

  if (!review) throw new ProductReviewNotFoundError({ productReviewId });

  return review;
}
