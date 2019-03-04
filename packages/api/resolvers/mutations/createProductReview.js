import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';

export default function(root, { productId, productReview }, { userId }) {
  log('mutation createProductReview', { userId, productId });
  return ProductReviews.createReview({
    productId,
    authorId: userId,
    ...productReview
  });
}
