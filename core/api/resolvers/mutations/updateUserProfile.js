import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { checkPermission, actions } from '../../roles';

const transform = (profile, isAllowTagManipulation) => {
  const transformedProfile = {
    'profile.firstName': profile.firstName,
    'profile.lastName': profile.lastName,
    'profile.birthday': profile.birthday,
    'profile.phoneMobile': profile.phoneMobile,
  };
  if (isAllowTagManipulation) {
    transformedProfile['profile.tags'] = profile.tags;
  }
  return transformedProfile;
};

export default function (root, { profile, userId: foreignUserId }, { userId }) {
  log(`mutation updateUserProfile ${userId}`, { userId });
  const normalizedUserId = foreignUserId || userId;

  const cleanedProfile = profile;
  if (!checkPermission(userId, actions.manageUsers)) {
    delete cleanedProfile.tags;
  }

  Users.update({ _id: normalizedUserId }, {
    $set: {
      updated: new Date(),
      ...transform(profile, checkPermission(userId, actions.manageUsers)),
    },
  });
  return Users.findOne({ _id: normalizedUserId });
}
