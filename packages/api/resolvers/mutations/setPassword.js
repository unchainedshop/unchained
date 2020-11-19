import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError, InvalidIdError } from '../../errors';
import hashPassword from '../../hashPassword';

export default async function setPassword(
  root,
  { newPassword: newHashedPassword, newPlainPassword, userId: foreignUserId },
  { userId: ownUserId }
) {
  log(`mutation setPassword ${foreignUserId}`, { userId: ownUserId });
  const userId = foreignUserId || ownUserId;
  if (!userId) throw new InvalidIdError({ userId });
  if (!newHashedPassword && !newPlainPassword) {
    throw new Error('Password is required');
  }
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const newPassword = newHashedPassword || hashPassword(newPlainPassword);
  await user.setPassword(newPassword);
  return Users.findOne({ _id: userId });
}
