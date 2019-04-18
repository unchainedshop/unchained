import { log } from 'meteor/unchained:core-logger';
import { UserNotFoundError } from '../../errors';

export default function(
  root,
  { newPassword, userId: foreignUserId },
  { userId, user }
) {
  log(`mutation setPassword ${foreignUserId}`, { userId });
  if (!user) throw new UserNotFoundError({ userId: foreignUserId });
  return user.updatePassword({ password: newPassword });
}
