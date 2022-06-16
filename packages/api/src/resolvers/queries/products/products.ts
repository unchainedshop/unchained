import { log } from '@unchainedshop/logger';
import { Context, Root, SortOption } from '@unchainedshop/types/api';
import { ProductQuery } from '@unchainedshop/types/products';

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
    `query products: ${params.limit} ${params.offset} ${
      params.includeDrafts ? 'includeDrafts' : ''
    } ${params.slugs?.join(',')}`,
    { userId },
  );
  return modules.products.findProducts(params);
}
