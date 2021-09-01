import { log } from 'meteor/unchained:core-logger';

import { Users } from 'meteor/unchained:core-users';

export default async function prepareUserAvatarUpload(
  root,
  { mediaName },
  { userId, ...context }
) {
  log('mutation prepareUserAvatarUpload', { mediaName, userId });
  return Users.createSignedUploadURL(mediaName, {
    userId,
    ...context,
  });
}
