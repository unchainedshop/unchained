import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { AssortmentQuery } from '@unchainedshop/types/assortments.js';

export default async function assortmentsCount(
  root: Root,
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
