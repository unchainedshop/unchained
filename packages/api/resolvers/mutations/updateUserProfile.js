import { log } from 'meteor/unchained:logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function updateUserProfile(
  root,
  { profile, userId: foreignUserId },
  { userId }
) {
  const normalizedUserId = foreignUserId || userId;
  log(`mutation updateUserProfile ${normalizedUserId}`, { userId });
  if (!Users.userExists({ userId: normalizedUserId }))
    throw UserNotFoundError({ id: normalizedUserId });
  Users.updateProfile({ userId: normalizedUserId, profile });
  return Users.findUser({ userId: normalizedUserId });
}
