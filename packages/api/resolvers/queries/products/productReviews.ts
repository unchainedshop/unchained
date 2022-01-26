import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function productReviews(
  root: Root,
  params: {
    limit: number;
    offset: number;
    sort: Array<{ key: string; value: 'DESC' | 'ASC' }>;
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
