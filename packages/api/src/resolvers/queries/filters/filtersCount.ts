import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { FilterQuery } from '@unchainedshop/types/filters';

export default async function filtersCount(
  root: Root,
  params: FilterQuery,
  { modules, userId }: Context,
) {
  log(
    `query filtersCount: ${params.includeInactive ? 'includeInactive' : ''} queryString: ${
      params.queryString
    } `,
    {
      userId,
    },
  );

  return modules.filters.count(params);
}
