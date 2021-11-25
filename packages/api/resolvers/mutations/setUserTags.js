import { log } from 'meteor/unchained:logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError, InvalidIdError } from '../../errors';

export default function setUserTags(
  root,
  { tags, userId: normalizedUserId },
  { userId }
) {
  log(`mutation setUserTags ${normalizedUserId}`, { userId });
  if (!normalizedUserId) throw new InvalidIdError({ normalizedUserId });
  if (!Users.userExists({ userId: normalizedUserId }))
    throw new UserNotFoundError({ normalizedUserId });
  Users.setTags({ userId: normalizedUserId, tags });
  return Users.findUser({ userId: normalizedUserId });
}
