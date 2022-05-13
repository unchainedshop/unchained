import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function events(
  root: Root,
  {
    limit,
    offset,
    types,
    created,
    queryString,
    sort,
  }: {
    limit?: number;
    offset?: number;
    types?: Array<string>;
    queryString?: string;
    created?: Date;
    sort: { created?: 'DESC' | 'ASC'; type?: 'DESC' | 'ASC' };
  },
  { modules, userId }: Context,
) {
  log(`query events ${types}  limit: ${limit} offset: ${offset} queryString: ${queryString}`, {
    userId,
  });

  return modules.events.findEvents({ types, limit, offset, created, queryString, sort });
}
