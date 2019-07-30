import { log } from 'meteor/unchained:core-logger';
import { Avatars, Users } from 'meteor/unchained:core-users';

export default async function(
  root,
  { avatar, userId: foreignUserId },
  { userId }
) {
  const normalizedUserId = foreignUserId || userId;
  log(`mutation updateUserAvatar ${normalizedUserId}`, { userId });
  const avatarInsertPromise =
    avatar instanceof Promise
      ? Avatars.insertWithRemoteFile({
          file: avatar,
          userId: normalizedUserId
        })
      : Avatars.insertWithRemoteBuffer({
          file: {
            ...avatar,
            buffer: Buffer.from(avatar.buffer, 'base64')
          },
          userId: normalizedUserId
        });

  const avatarRef = await avatarInsertPromise;

  Users.update(
    { _id: normalizedUserId },
    {
      $set: {
        updated: new Date(),
        avatarId: avatarRef._id
      }
    }
  );
  return Users.findOne({ _id: normalizedUserId });
}
