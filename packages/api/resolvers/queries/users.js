import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function users(
  root,
  { limit, offset, includeGuests, queryString },
  { userId }
) {
  log(
    `query users ${limit} ${offset} ${queryString} ${
      includeGuests ? 'includeGuests' : ''
    }`,
    { userId }
  );
  return Users.findUsers({ limit, offset, includeGuests, queryString });
}
