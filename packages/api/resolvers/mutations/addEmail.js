import { log } from 'meteor/unchained:logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default async function addEmail(
  root,
  { email, userId: foreignUserId },
  { userId: ownUserId }
) {
  log(`mutation addEmail ${email} ${foreignUserId}`, { userId: ownUserId });
  const userId = foreignUserId || ownUserId;
  const user = Users.findUser({ userId });
  if (!user) throw new UserNotFoundError({ userId });
  const res = await user.addEmail(email);
  return res;
}
