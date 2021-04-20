import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function usersCount(
  root,
  { includeGuests, queryString },
  { userId }
) {
  log(
    `query usersCount ${queryString || ''} ${
      includeGuests ? 'includeGuests' : ''
    }`,
    { userId }
  );
  return Users.count({ includeGuests, queryString });
}
