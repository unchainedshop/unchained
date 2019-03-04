import { log } from "meteor/unchained:core-logger";
import { ProductReviews } from "meteor/unchained:core-products";

export default function(root, { productReviewId }, { userId }) {
  log(`query productReview ${productReviewId}`, { userId });
  return ProductReviews.findReviewById(productReviewId);
}
