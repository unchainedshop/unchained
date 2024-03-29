import { log } from '@unchainedshop/logger';
import { Context, Root, SortOption } from '@unchainedshop/types/api.js';
import { ProductQuery } from '@unchainedshop/types/products.js';

export default async function products(
  root: Root,
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
