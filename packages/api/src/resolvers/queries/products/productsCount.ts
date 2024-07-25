import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { ProductQuery } from '@unchainedshop/types/products.js';

export default async function productsCount(
  root: never,
  params: ProductQuery,
  { modules, userId }: Context,
) {
  log(
    `query productsCount:  ${params.includeDrafts ? 'includeDrafts' : ''} ${params.slugs?.join(
      ',',
    )} queryString: ${params.queryString}`,
    { userId },
  );
  return modules.products.count(params);
}
