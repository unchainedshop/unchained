import { log } from 'unchained-logger';

import { Users } from 'meteor/unchained:core-users';

export default async function prepareUserAvatarUpload(
  root,
  { mediaName, userId },
  { userId: currentUserId, ...context }
) {
  log('mutation prepareUserAvatarUpload', { mediaName, userId });
  return Users.createSignedUploadURL(
    { mediaName, userId: userId || currentUserId },
    {
      userId,
      ...context,
    }
  );
}
