import { log } from '@unchainedshop/logger';
import type { FilterQuery } from '@unchainedshop/core-filters';
import type { Context } from '../../../context.ts';

export default async function filtersCount(
  root: never,
  params: FilterQuery & { queryString?: string },
  { services, userId }: Context,
) {
  const { queryString, ...query } = params;
  log(
    `query filtersCount: ${params.includeInactive ? 'includeInactive' : ''} queryString: ${queryString} `,
    {
      userId,
    },
  );

  return services.filters.searchFiltersCount(queryString, query);
}
