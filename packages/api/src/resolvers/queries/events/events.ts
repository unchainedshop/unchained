import { log } from 'meteor/unchained:logger';
import { Root, Context, SortOption } from '@unchainedshop/types/api';
import { EventQuery } from '@unchainedshop/types/events';

export default async function events(
  root: Root,
  {
    limit,
    offset,
    types,
    created,
    queryString,
    sort,
  }: EventQuery & {
    limit?: number;
    offset?: number;
    sort: Array<SortOption>;
  },
  { modules, userId }: Context,
) {
  log(`query events ${types}  limit: ${limit} offset: ${offset} queryString: ${queryString}`, {
    userId,
  });

  return modules.events.findEvents({ types, limit, offset, created, queryString, sort });
}
