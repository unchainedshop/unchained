import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError, InvalidIdError } from '../../errors';

export default async function setPassword(
  root,
  { newPassword, userId: foreignUserId },
  { userId: ownUserId }
) {
  log(`mutation setPassword ${foreignUserId}`, { userId: ownUserId });
  const userId = foreignUserId || ownUserId;
  if (!userId) throw new InvalidIdError({ userId });
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  await user.setPassword(newPassword);
  return Users.findOne({ _id: userId });
}
