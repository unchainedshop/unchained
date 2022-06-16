import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

import { ProductReview } from '@unchainedshop/types/products.reviews';
import { InvalidIdError, ProductNotFoundError } from '../../../errors';

export default async function createProductReview(
  root: Root,
  { productId, productReview }: { productId: string; productReview: ProductReview },
  { modules, userId }: Context,
) {
  log('mutation createProductReview', { userId, productId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  return modules.products.reviews.create(
    {
      productId,
      authorId: userId,
      ...productReview,
    },
    userId,
  );
}
