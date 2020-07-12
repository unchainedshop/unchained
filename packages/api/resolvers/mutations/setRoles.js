import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function (root, { roles, userId: foreignUserId }, { userId }) {
  log(`mutation setRoles ${foreignUserId}`, { userId });
  if (!foreignUserId) throw new Error('Invalid user ID provided');
  const user = Users.findOne({ _id: foreignUserId });
  if (!user) throw new UserNotFoundError({ userId: foreignUserId });
  return user.setRoles(roles);
}
