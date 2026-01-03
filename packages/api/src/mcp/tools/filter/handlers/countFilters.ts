import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function countFilters(context: Context, params: Params<'COUNT'>) {
  const { services } = context;
  const { includeInactive = false, queryString } = params;

  const count = await services.filters.searchFiltersCount(queryString, {
    includeInactive,
  });

  return { count };
}
