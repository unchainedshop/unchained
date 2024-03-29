import { log } from '@unchainedshop/logger';
import { Context, Root, SortOption } from '@unchainedshop/types/api.js';
import { AssortmentQuery } from '@unchainedshop/types/assortments.js';

export default async function assortments(
  root: Root,
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
