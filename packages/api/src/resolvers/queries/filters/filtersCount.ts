import { log } from '@unchainedshop/logger';
import { FilterQuery } from '@unchainedshop/core-filters';
import { Context } from '../../../context.js';

export default async function filtersCount(
  root: never,
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
