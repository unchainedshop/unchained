import type { Context } from '../../../../context.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';

export default async function listFilters(context: Context, params: Params<'LIST'>) {
  const { services } = context;
  const { limit = 50, offset = 0, sort, includeInactive = false, queryString } = params;

  const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

  const filters = await services.filters.searchFilters(queryString, {
    includeInactive,
    limit,
    offset,
    sort: sortOptions as any,
  });

  return {
    filters: await Promise.all(
      filters?.map(async ({ _id }) => getNormalizedFilterDetails(_id, context)),
    ),
  };
}
