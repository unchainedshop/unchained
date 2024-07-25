import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/types/api.js';
import { FilterQuery } from '@unchainedshop/types/filters.js';
import { Context } from '../../../types.js';

export default async function filters(
  root: never,
  params: FilterQuery & {
    limit?: number;
    offset?: number;
    sort?: Array<SortOption>;
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
