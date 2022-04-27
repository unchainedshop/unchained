import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function assortments(
  root: Root,
  params: {
    queryString?: string;
    tags?: Array<string>;
    slugs?: Array<string>;
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
    includeLeaves?: boolean;
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
