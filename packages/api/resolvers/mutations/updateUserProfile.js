import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function (root, { profile, userId: foreignUserId }, { userId }) {
  const normalizedUserId = foreignUserId || userId;
  log(`mutation updateUserProfile ${normalizedUserId}`, { userId });

  const transformedProfile = Object.keys(profile).reduce((acc, profileKey) => {
    return {
      ...acc,
      [`profile.${profileKey}`]: profile[profileKey],
    };
  }, {});

  Users.update(
    { _id: normalizedUserId },
    {
      $set: {
        updated: new Date(),
        ...transformedProfile,
      },
    },
  );
  return Users.findOne({ _id: normalizedUserId });
}
