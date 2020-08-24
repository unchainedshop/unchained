import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function user(root, { userId }, { userId: ownUserId }) {
  log(`query user ${userId}`, { userId: ownUserId });

  const user = Users.findOne({ _id: userId || ownUserId });

  if (!user) throw new UserNotFoundError({ userId });

  return user;
}
