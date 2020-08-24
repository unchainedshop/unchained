import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function user(root, { userId }, { userId: ownUserId }) {
  log(`query user ${userId}`, { userId: ownUserId });
  return Users.findOne({ _id: userId || ownUserId });
}
