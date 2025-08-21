import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function countProducts(context: Context, params: Params<'COUNT'>) {
  const { modules } = context;
  const { tags, slugs, queryString, includeDrafts = false } = params;

  const count = await modules.products.count({
    tags,
    slugs,
    queryString,
    includeDrafts,
  });
  return { count };
}
