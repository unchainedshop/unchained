import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { ProductQuery } from '@unchainedshop/core-products';
import type { Context } from '../../../context.ts';

export default async function products(
  root: never,
  params: ProductQuery & {
    sort: SortOption[];
    limit: number;
    offset: number;
  },
  { modules, userId }: Context,
) {
  log(`query products `, { ...params, userId });
  return modules.products.findProducts(params);
}
