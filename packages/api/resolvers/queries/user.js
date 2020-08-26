import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function user(root, { userId }, { userId: ownUserId }) {
  log(`query user ${userId}`, { userId: ownUserId });

  const foundUser = Users.findOne({ _id: userId || ownUserId });

  if (!foundUser) throw new UserNotFoundError({ userId });

  return foundUser;
}
