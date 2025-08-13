import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function listFilters(context: Context, params: Params<'LIST'>) {
  const { modules } = context;
  const { limit = 50, offset = 0, sort, includeInactive = false, queryString } = params;

  const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

  const filters = await modules.filters.findFilters(
    {
      includeInactive,
      queryString,
    },
    {
      limit,
      skip: offset,
      sort: sortOptions as any,
    },
  );

  return { filters };
}
