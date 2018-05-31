import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { checkPermission, actions } from '../../roles';

const transform = (profile, hasManageUserPermissions) => { // eslint-disable-line
  const transformedProfile = {
    'profile.displayName': profile.displayName,
    'profile.birthday': profile.birthday,
    'profile.phoneMobile': profile.phoneMobile,
    'profile.gender': profile.gender,
    'profile.address': profile.address,
  };
  return transformedProfile;
};

export default function (root, { profile, userId: foreignUserId }, { userId }) {
  const normalizedUserId = foreignUserId || userId;
  log(`mutation updateUserProfile ${normalizedUserId}`, { userId });

  Users.update({ _id: normalizedUserId }, {
    $set: {
      updated: new Date(),
      ...transform(profile, checkPermission(userId, actions.manageUsers)),
    },
  });
  return Users.findOne({ _id: normalizedUserId });
}
