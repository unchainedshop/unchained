import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError, InvalidIdError } from '../../errors';

export default function setUserTags(
  root,
  { tags, userId: normalizedUserId },
  { userId }
) {
  log(`mutation setUserTags ${normalizedUserId}`, { userId });
  if (!normalizedUserId) throw new InvalidIdError({ normalizedUserId });
  const user = Users.findOne({ _id: normalizedUserId });
  if (!user) throw new UserNotFoundError({ normalizedUserId });
  Users.update(
    { _id: normalizedUserId },
    {
      $set: {
        updated: new Date(),
        tags,
      },
    }
  );
  return Users.findOne({ _id: normalizedUserId });
}
