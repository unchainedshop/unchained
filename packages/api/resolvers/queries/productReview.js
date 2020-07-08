import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { ProductReviewNotFoundError } from '../../errors';

export default function (root, { productReviewId }, { userId }) {
  log(`query productReview ${productReviewId}`, { userId });

  if (!productReviewId) throw new Error('Invalid product review ID provided');

  const review = ProductReviews.findReviewById(productReviewId);

  if (!review) throw new ProductReviewNotFoundError({ productReviewId });

  return review;
}
