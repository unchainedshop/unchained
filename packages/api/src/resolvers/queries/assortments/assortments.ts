import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { AssortmentQuery } from '@unchainedshop/core-assortments';
import type { Context } from '../../../context.ts';

export default async function assortments(
  root: never,
  params: AssortmentQuery & {
    limit?: number;
    offset?: number;
    sort?: SortOption[];
    queryString?: string;
  },
  { services, userId }: Context,
) {
  log(
    `query assortments: ${params.limit}  ${params.offset} ${
      params.includeInactive ? 'includeInactive' : ''
    } ${params.slugs?.join(',')}  queryString: ${params.queryString}`,
    { userId },
  );

  const { queryString, ...query } = params;

  return services.assortments.searchAssortments(queryString, query);
}
