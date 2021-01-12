import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError, InvalidIdError } from '../../errors';

export default async function setUsername(
  root,
  { username, userId: foreignUserId },
  { userId: ownUserId }
) {
  log(`mutation setUsername ${foreignUserId}`, { userId: ownUserId });
  const userId = foreignUserId || ownUserId;
  if (!userId) throw new InvalidIdError({ userId });
  const user = Users.findUser({ userId });
  if (!user) throw new UserNotFoundError({ userId });
  const res = await user.setUsername(username);
  return res;
}
