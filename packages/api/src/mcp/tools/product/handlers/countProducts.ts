import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function countProducts(context: Context, params: Params<'COUNT'>) {
  const { services } = context;
  const { tags, slugs, queryString, includeDrafts = false } = params;

  const count = await services.productsSimple.searchProductsCount(queryString, {
    tags,
    slugs,
    includeDrafts,
  });
  return { count };
}
