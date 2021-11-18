import { log } from 'unchained-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default async function updateUserAvatar(
  root,
  { avatar, userId: foreignUserId },
  { userId }
) {
  const normalizedUserId = foreignUserId || userId;
  log(`mutation updateUserAvatar ${normalizedUserId}`, { userId });
  if (!Users.userExists({ userId: normalizedUserId }))
    throw new UserNotFoundError({ userId: normalizedUserId });
  await Users.updateAvatar({ userId: normalizedUserId, avatar });
  return Users.findUser({ userId: normalizedUserId });
}
