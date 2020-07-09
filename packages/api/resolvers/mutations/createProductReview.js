import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';

export default function (root, { productId, productReview }, { userId }) {
  log('mutation createProductReview', { userId, productId });
  if (!productId) throw new Error('Invalid product ID provided');
  return ProductReviews.createReview({
    productId,
    authorId: userId,
    ...productReview,
  });
}
