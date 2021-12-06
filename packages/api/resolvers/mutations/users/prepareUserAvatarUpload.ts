import { log } from 'meteor/unchained:logger';

import { Context, Root } from '@unchainedshop/types/api';

export default async function prepareUserAvatarUpload(
  root: Root,
  params: { mediaName: string; userId: string },
  { modules, userId }: Context
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation prepareUserAvatarUpload ${normalizedUserId}`, {
    mediaName: params.mediaName,
    userId,
  });

  return await modules.files.createSignedURL(
    'user-avatars',
    params.mediaName,
    { userId: normalizedUserId },
    userId
  );
}
