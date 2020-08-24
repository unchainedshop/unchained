import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function setPassword(
  root,
  { newPassword, userId: foreignUserId },
  { userId: ownUserId },
) {
  log(`mutation setPassword ${foreignUserId}`, { userId: ownUserId });
  const userId = foreignUserId || ownUserId;
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  return user.setPassword(newPassword);
}
