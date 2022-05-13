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
<<<<<<< HEAD
    sort,
  }: EventQuery & {
    limit?: number;
    offset?: number;
    sort: Array<SortOption>;
=======
  }: {
    limit?: number;
    offset?: number;
    types?: Array<string>;
    queryString?: string;
    created?: Date;
>>>>>>> Exten query.events filter #400
  },
  { modules, userId }: Context,
) {
  log(`query events ${types}  limit: ${limit} offset: ${offset} queryString: ${queryString}`, {
    userId,
  });

<<<<<<< HEAD
  return modules.events.findEvents({ types, limit, offset, created, queryString, sort });
=======
  return modules.events.findEvents({ types, limit, offset, created, queryString });
>>>>>>> Exten query.events filter #400
}
