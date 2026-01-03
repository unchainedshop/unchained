import type { Context } from '../../../../context.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function listProducts(context: Context, params: Params<'LIST'>) {
  const { services } = context;
  const { limit = 50, offset = 0, tags, slugs, queryString, includeDrafts = false, sort } = params;

  const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

  const products = await services.productsSimple.searchProducts(queryString, {
    limit,
    offset,
    tags,
    slugs,
    includeDrafts,
    sort: sortOptions,
  });

  return {
    products: await Promise.all(
      products?.map(async ({ _id }) => getNormalizedProductDetails(_id, context)),
    ),
  };
}
