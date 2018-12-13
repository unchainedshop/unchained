import { Promise } from 'meteor/promise';
import { log } from 'meteor/unchained:core-logger';
import { Avatars, Users } from 'meteor/unchained:core-users';

export default function (root, { avatar, userId: foreignUserId }, { userId }) {
  const normalizedUserId = foreignUserId || userId;
  log(`mutation updateUserAvatar ${normalizedUserId}`, { userId });
  const avatarRef = Promise.await(Avatars.insertWithRemoteFile({
    file: avatar,
    userId: normalizedUserId,
  }));
  Users.update({ _id: normalizedUserId }, {
    $set: {
      updated: new Date(),
      avatarId: avatarRef._id,
    },
  });
  return Users.findOne({ _id: normalizedUserId });
}
