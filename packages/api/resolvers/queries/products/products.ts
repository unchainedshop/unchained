import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function products(
  root: Root,
  params: {
    includeDrafts: boolean;
    limit: number;
    offset: number;
    slugs?: Array<string>;
    tags?: Array<string>;
  },
  { modules, userId }: Context,
) {
  log(
    `query products: ${params.limit} ${params.offset} ${
      params.includeDrafts ? 'includeDrafts' : ''
    } ${params.slugs?.join(',')}`,
    { userId },
  );

  return modules.products.findProducts(params);
}
