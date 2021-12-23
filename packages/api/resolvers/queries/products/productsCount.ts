import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function productsCount(
  root: Root,
  params: {
    includeDrafts: boolean;
    slugs?: Array<string>;
    tags?: Array<string>;
  },
  { modules, userId }: Context
) {
  log(
    `query productsCount:  ${
      params.includeDrafts ? 'includeDrafts' : ''
    } ${params.slugs?.join(',')}`,
    { userId }
  );
  return await modules.products.count(params);
}
