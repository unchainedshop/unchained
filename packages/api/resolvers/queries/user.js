import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function user(root, { userId: Id }, { userId: ownUserId }) {
  log(`query user ${Id}`, { Id: ownUserId });
  const foundUser = Users.findUser({ userId: Id || ownUserId });
  if (!foundUser) throw new UserNotFoundError({ userId: Id });

  return foundUser;
}
