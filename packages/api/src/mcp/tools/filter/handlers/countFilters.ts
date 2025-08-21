import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function countFilters(context: Context, params: Params<'COUNT'>) {
  const { modules } = context;
  const { includeInactive = false, queryString } = params;

  const count = await modules.filters.count({
    includeInactive,
    queryString,
  });

  return { count };
}
