import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function(root, { limit, offset, includeGuests }, { userId }) {
  log(
    `query users ${limit} ${offset} ${includeGuests ? 'includeGuests' : ''}`,
    { userId }
  );
  const selector = {};
  if (!includeGuests) {
    selector.guest = { $ne: true };
  }
  const users = Users.find(selector, { skip: offset, limit }).fetch();
  return users;
}
