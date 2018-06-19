import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function (root, { limit = 20, offset = 0, includeGuests = false }, { userId }) {
  log(`query users ${limit} ${offset} ${includeGuests ? 'includeGuests' : ''}`, { userId });
  const selector = { };
  if (!includeGuests) {
    selector.guest = { $ne: true };
  }
  const users = Users.find(selector, { skip: offset, limit }).fetch();
  return users;
}
