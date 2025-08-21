import { Context } from '../../../../context.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function listProducts(context: Context, params: Params<'LIST'>) {
  const { modules } = context;
  const { limit = 50, offset = 0, tags, slugs, queryString, includeDrafts = false, sort } = params;

  const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

  const products = await modules.products.findProducts({
    limit,
    offset,
    tags,
    slugs,
    queryString,
    includeDrafts,
    sort: sortOptions,
  });

  return {
    products: await Promise.all(
      products?.map(async ({ _id }) => getNormalizedProductDetails(_id, context)),
    ),
  };
}
