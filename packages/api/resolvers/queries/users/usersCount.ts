import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function usersCount(
  root: Root,
  {
    includeGuests,
    queryString,
  }: {
    includeGuests: boolean;
    queryString?: string;
  },
  { modules, userId }: Context
) {
  log(
    `query usersCount ${queryString || ''} ${
      includeGuests ? 'includeGuests' : ''
    }`,
    { userId }
  );

  return modules.users.count({ includeGuests, queryString });
}
