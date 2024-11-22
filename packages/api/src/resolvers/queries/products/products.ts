import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { ProductQuery } from '@unchainedshop/core-products';
import { Context } from '../../../context.js';

export default async function products(
  root: never,
  params: ProductQuery & {
    sort: Array<SortOption>;
    limit: number;
    offset: number;
  },
  { modules, userId }: Context,
) {
  log(
    `query products: ${params.limit || 0} ${params.offset || 0} ${
      params.includeDrafts ? 'includeDrafts' : ''
    } ${params.slugs?.join(',')}`,
    { userId },
  );
  return modules.products.findProducts(params);
}
