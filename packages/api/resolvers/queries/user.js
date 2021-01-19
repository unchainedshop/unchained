import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function user(root, { userId: Id }, { userId: ownUserId }) {
  log(`query user ${Id}`, { Id: ownUserId });

  return Users.findUser({ userId: Id || ownUserId });
}
