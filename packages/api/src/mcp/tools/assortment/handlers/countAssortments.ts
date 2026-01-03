import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function countAssortments(context: Context, params: Params<'COUNT'>) {
  const { services } = context;
  const { tags, slugs, queryString, includeInactive = false, includeLeaves = false } = params;

  const count = await services.assortments.searchAssortmentsCount(queryString, {
    tags,
    slugs,
    includeInactive,
    includeLeaves,
  });
  return { count };
}
