import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export default async function prepareUserAvatarUpload(
  root: never,
  params: { mediaName: string; userId: string },
  context: Context,
) {
  const { services, userId } = context;
  const normalizedUserId = params.userId || userId;

  log(`mutation prepareUserAvatarUpload ${normalizedUserId}`, {
    mediaName: params.mediaName,
    userId,
  });

  return services.files.createSignedURL({
    directoryName: 'user-avatars',
    fileName: params.mediaName,
    meta: { userId: normalizedUserId },
  });
}
