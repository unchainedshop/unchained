import { log } from 'unchained-logger';
import { ProductReviews } from 'meteor/unchained:core-products';
import { InvalidIdError } from '../../errors';

export default function productReview(root, { productReviewId }, { userId }) {
  log(`query productReview ${productReviewId}`, { userId });
  if (!productReviewId) throw new InvalidIdError({ productReviewId });
  return ProductReviews.findReview({ productReviewId });
}
