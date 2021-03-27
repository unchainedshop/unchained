import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function users(
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
