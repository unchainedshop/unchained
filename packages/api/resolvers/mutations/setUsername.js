import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function setUsername(
  root,
  { username, userId: foreignUserId },
  { userId },
) {
  log(`mutation setUsername ${foreignUserId}`, { userId });
  const user = Users.findOne({ _id: foreignUserId });
  if (!user) throw new UserNotFoundError({ userId: foreignUserId });
  return user.setUsername(username);
}
