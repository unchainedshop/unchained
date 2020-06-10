import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function (
  root,
  { email, userId: foreignUserId },
  { userId: ownUserId },
) {
  log(`mutation removeEmail ${email} ${foreignUserId}`, { userId: ownUserId });
  const userId = foreignUserId || ownUserId;
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  return user.removeEmail(email);
}
