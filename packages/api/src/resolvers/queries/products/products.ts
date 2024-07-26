import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { ProductQuery } from '@unchainedshop/types/products.js';
import { Context } from '../../../types.js';

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
