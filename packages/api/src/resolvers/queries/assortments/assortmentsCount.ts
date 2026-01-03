import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { AssortmentQuery } from '@unchainedshop/core-assortments';

export default async function assortmentsCount(
  root: never,
  params: AssortmentQuery & { queryString?: string },
  { services, userId }: Context,
) {
  const { queryString, ...query } = params;
  log(
    `query assortmentsCount: ${params.includeInactive ? 'includeInactive' : ''} ${params.slugs?.join(
      ',',
    )}  queryString: ${queryString}`,
    { userId },
  );

  return services.assortments.searchAssortmentsCount(queryString, query);
}
