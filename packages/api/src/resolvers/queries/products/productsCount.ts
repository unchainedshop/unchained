import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductQuery } from '@unchainedshop/types/products';

export default async function productsCount(
  root: Root,
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
