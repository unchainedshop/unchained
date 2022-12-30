import { log } from '@unchainedshop/logger';
import { Root, Context, SortOption } from '@unchainedshop/types/api.js';
import { FilterQuery } from '@unchainedshop/types/filters.js';

export default async function filters(
  root: Root,
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
