import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function (root, { userId }, { userId: ownUserId }) {
  log(`query user ${userId}`, { userId: ownUserId });

  if (!userId) throw new Error('Invalid user ID provided');

  const user = Users.findOne({ _id: userId || ownUserId });

  if (!user) throw new UserNotFoundError({ userId });

  return user;
}
