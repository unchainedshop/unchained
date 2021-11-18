import { log } from 'unchained-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError, InvalidIdError } from '../../errors';

export default function setRoles(
  root,
  { roles, userId: foreignUserId },
  { userId }
) {
  log(`mutation setRoles ${foreignUserId}`, { userId });
  if (!foreignUserId) throw new InvalidIdError({ foreignUserId });
  const user = Users.findUser({ userId: foreignUserId });
  if (!user) throw new UserNotFoundError({ userId: foreignUserId });
  return user.setRoles(roles);
}
