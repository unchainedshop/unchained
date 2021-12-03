import { log } from 'meteor/unchained:logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function updateEmail(
  root,
  { email, userId: foreignUserId },
  { userId: ownUserId }
) {
  log(`mutation updateEmail ${email} ${foreignUserId}`, { userId: ownUserId });
  const userId = foreignUserId || ownUserId;
  const user = Users.findUser({ userId });
  if (!user) throw new UserNotFoundError({ userId });
  return user.updateEmail(email);
}
