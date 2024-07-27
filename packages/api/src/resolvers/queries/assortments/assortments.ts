import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { AssortmentQuery } from '@unchainedshop/core-assortments';
import { Context } from '../../../types.js';

export default async function assortments(
  root: never,
  params: AssortmentQuery & {
    limit?: number;
    offset?: number;
    sort?: Array<SortOption>;
  },
  { modules, userId }: Context,
) {
  log(
    `query assortments: ${params.limit}  ${params.offset} ${
      params.includeInactive ? 'includeInactive' : ''
    } ${params.slugs?.join(',')}  queryString: ${params.queryString}`,
    { userId },
  );

  return modules.assortments.findAssortments(params);
}
