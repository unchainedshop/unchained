import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function events(
  root: Root,
  {
    limit,
    type,
    offset,
    queryString,
  }: { type: string; limit: number; offset: number; queryString: string },
  { modules, userId }: Context,
) {
  log(`query events ${type}`, { userId });

  return modules.events.findEvents({ type, limit, offset, queryString });
}
