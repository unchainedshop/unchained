import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

import { ProductReview } from '@unchainedshop/core-products';
import { InvalidIdError, ProductNotFoundError } from '../../../errors.js';

export default async function createProductReview(
  root: never,
  { productId, productReview }: { productId: string; productReview: ProductReview },
  { modules, userId }: Context,
) {
  log('mutation createProductReview', { userId, productId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  return modules.products.reviews.create({
    productId,
    authorId: userId,
    ...productReview,
  });
}
