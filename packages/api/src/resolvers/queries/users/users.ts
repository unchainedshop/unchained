import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function users(
  root: Root,
  {
    limit,
    offset,
    includeGuests,
    queryString,
  }: {
    limit: number;
    offset: number;
    includeGuests: boolean;
    queryString?: string;
  },
  { modules, userId }: Context,
) {
  log(`query users ${limit} ${offset} ${queryString} ${includeGuests ? 'includeGuests' : ''}`, {
    userId,
  });

  return modules.users.findUsers({
    limit,
    offset,
    includeGuests,
    queryString,
  });
}
