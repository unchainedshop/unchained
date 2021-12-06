import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';

export default async function prepareUserAvatarUpload(
  root: Root,
  params: { mediaName: string; userId: string },
  context: Context
) {
  const { modules, services, userId } = context;
  const normalizedUserId = params.userId || userId;

  log(`mutation prepareUserAvatarUpload ${normalizedUserId}`, {
    mediaName: params.mediaName,
    userId,
  });

  return await modules.files.createSignedURL(
    'user-avatars',
    params.mediaName,
    { userId: normalizedUserId },
    userId,
    (file) => services.users.updateUserAvatarAfterUpload({ file }, context)
  );
}
