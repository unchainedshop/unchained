import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default async function disableTOTP(
  root,
  { code, userId: foreignUserId },
  { userId: ownUserId }
) {
  log(`mutation disableTOTP ${code} ${foreignUserId}`, {
    userId: ownUserId,
  });
  const userId = foreignUserId || ownUserId;
  const user = Users.findUser({ userId });
  if (!user) throw new UserNotFoundError({ userId });
  await Users.disableTOTP(userId, code, {
    forceDisable: ownUserId !== foreignUserId,
  });
  return Users.findUser({ userId });
}
