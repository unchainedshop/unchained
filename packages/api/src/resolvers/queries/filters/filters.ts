import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { FilterQuery } from '@unchainedshop/core-filters';
import type { Context } from '../../../context.ts';

export default async function filters(
  root: never,
  params: FilterQuery & {
    limit?: number;
    offset?: number;
    sort?: SortOption[];
  },
  { modules, userId }: Context,
) {
  log(
    `query filters: ${params.limit} ${params.offset} ${params.includeInactive ? 'includeInactive' : ''}`,
    {
      userId,
    },
  );

  return modules.filters.findFilters(params);
}
