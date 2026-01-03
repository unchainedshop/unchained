import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { ProductQuery } from '@unchainedshop/core-products';

export default async function productsCount(
  root: never,
  params: ProductQuery & { queryString?: string },
  { services, userId }: Context,
) {
  const { queryString, ...query } = params;
  log(
    `query productsCount:  ${params.includeDrafts ? 'includeDrafts' : ''} ${params.slugs?.join(
      ',',
    )} queryString: ${queryString}`,
    { userId },
  );
  return services.productsSimple.searchProductsCount(queryString, query);
}
