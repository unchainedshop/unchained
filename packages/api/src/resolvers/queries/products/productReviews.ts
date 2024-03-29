import { log } from '@unchainedshop/logger';
import { Root, Context, SortOption } from '@unchainedshop/types/api.js';

export default async function productReviews(
  root: Root,
  params: {
    limit: number;
    offset: number;
    sort: Array<SortOption>;
    queryString?: string;
  },
  { modules, userId }: Context,
) {
  const { limit, offset, queryString } = params;

  log(`query productReviews: ${limit} ${offset} ${queryString || ''}`, {
    userId,
  });

  return modules.products.reviews.findProductReviews(params);
}
