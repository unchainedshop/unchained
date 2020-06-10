import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function (root, { tags, userId: normalizedUserId }, { userId }) {
  log(`mutation setUserTags ${normalizedUserId}`, { userId });

  Users.update(
    { _id: normalizedUserId },
    {
      $set: {
        updated: new Date(),
        tags,
      },
    },
  );
  return Users.findOne({ _id: normalizedUserId });
}
