import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { ProductReviewQuery } from '@unchainedshop/types/products.reviews.js';

export default async function productReviewsCount(
  root: Root,
  params: ProductReviewQuery,
  { modules, userId }: Context,
) {
  log(`query productReviewsCount`, { userId });

  return modules.products.reviews.count(params);
}
