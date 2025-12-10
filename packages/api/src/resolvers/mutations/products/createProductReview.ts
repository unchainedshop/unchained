import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

import type { ProductReview } from '@unchainedshop/core-products';
import { InvalidIdError, ProductNotFoundError } from '../../../errors.ts';

export default async function createProductReview(
  root: never,
  {
    productId,
    productReview,
  }: { productId: string; productReview: Pick<ProductReview, 'title' | 'rating' | 'meta'> },
  { modules, userId }: Context,
) {
  log('mutation createProductReview', { userId, productId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  return modules.products.reviews.create({
    ...productReview,
    productId,
    authorId: userId!,
  });
}
