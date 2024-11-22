import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { AssortmentQuery } from '@unchainedshop/core-assortments';

export default async function assortmentsCount(
  root: never,
  params: AssortmentQuery,
  { modules, userId }: Context,
) {
  log(
    `query assortmentsCount: ${params.includeInactive ? 'includeInactive' : ''} ${params.slugs?.join(
      ',',
    )}  queryString: ${params.queryString}`,
    { userId },
  );

  return modules.assortments.count(params);
}
