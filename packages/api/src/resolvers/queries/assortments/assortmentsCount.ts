import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function assortmentsCount(
  root: Root,
  params: {
    tags?: Array<string>;
    slugs?: Array<string>;
    includeInactive?: boolean;
    includeLeaves?: boolean;
    queryString?: string;
  },
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
