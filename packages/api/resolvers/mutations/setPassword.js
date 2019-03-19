import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function(
  root,
  { newPassword, userId: foreignUserId },
  { userId }
) {
  log(`mutation setPassword ${foreignUserId}`, { userId });
  const user = Users.findOne({ _id: foreignUserId });
  if (!user) throw new UserNotFoundError({ userId: foreignUserId });
  return user.updatePassword({ password: newPassword });
}
