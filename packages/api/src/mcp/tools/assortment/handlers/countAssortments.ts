import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function countAssortments(context: Context, params: Params<'COUNT'>) {
  const { modules } = context;
  const { tags, slugs, queryString, includeInactive = false, includeLeaves = false } = params;

  const count = await modules.assortments.count({
    tags,
    slugs,
    queryString,
    includeInactive,
    includeLeaves,
  });
  return { count };
}
