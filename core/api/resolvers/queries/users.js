import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function (root, { limit = 20, offset = 0, ignoreGuests = false }, { userId }) {
  log(`query users ${limit} ${offset} ${ignoreGuests ? 'ignoreGuests' : ''}`, { userId });
  const selector = { };
  if (ignoreGuests) {
    selector['profile.guest'] = { $ne: true };
  }
  const users = Users.find(selector, { skip: offset, limit }).fetch();
  return users;
}
