import { log } from '@unchainedshop/logger';
import type { ProductReviewQuery } from '@unchainedshop/core-products';
import type { Context } from '../../../context.ts';

export default async function productReviewsCount(
  root: never,
  params: ProductReviewQuery,
  { modules, userId }: Context,
) {
  log(`query productReviewsCount`, { userId });

  return modules.products.reviews.count(params);
}
