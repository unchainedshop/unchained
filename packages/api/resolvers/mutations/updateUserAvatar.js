import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default async function updateUserAvatar(
  root,
  { avatar, userId: foreignUserId },
  { userId }
) {
  const normalizedUserId = foreignUserId || userId;
  log(`mutation updateUserAvatar ${normalizedUserId}`, { userId });
  const user = Users.findOne({ _id: normalizedUserId });
  if (!user) throw new UserNotFoundError({ userId });
  const updatedUser = user.updateAvatar({ avatar });
  return updatedUser;
}
