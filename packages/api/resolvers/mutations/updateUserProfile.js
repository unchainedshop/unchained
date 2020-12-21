import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function updateUserProfile(
  root,
  { profile, userId: foreignUserId },
  { userId }
) {
  const normalizedUserId = foreignUserId || userId;
  log(`mutation updateUserProfile ${normalizedUserId}`, { userId });
  const user = Users.findOne({ _id: normalizedUserId });
  if (!user) throw UserNotFoundError({ id: normalizedUserId });
  return user.updateProfile({ profile });
}
