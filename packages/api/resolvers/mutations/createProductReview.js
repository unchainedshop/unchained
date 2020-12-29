import { log } from 'meteor/unchained:core-logger';
import { ProductReviews, Products } from 'meteor/unchained:core-products';

import { InvalidIdError, ProductNotFoundError } from '../../errors';

export default function createProductReview(
  root,
  { productId, productReview },
  { userId }
) {
  log('mutation createProductReview', { userId, productId });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  return ProductReviews.createReview({
    productId,
    authorId: userId,
    ...productReview,
  });
}
