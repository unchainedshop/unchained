import { log } from '@unchainedshop/logger';
import { ProductReviewQuery } from '@unchainedshop/types/products.reviews.js';
import { Context } from '../../../types.js';

export default async function productReviewsCount(
  root: never,
  params: ProductReviewQuery,
  { modules, userId }: Context,
) {
  log(`query productReviewsCount`, { userId });

  return modules.products.reviews.count(params);
}
