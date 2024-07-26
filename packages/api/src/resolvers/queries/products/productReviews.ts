import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { Context } from '../../../types.js';

export default async function productReviews(
  root: never,
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
