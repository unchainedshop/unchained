import { UpdateUserAvatarAfterUploadService } from '@unchainedshop/types/user.js';
import { log, LogLevel } from '@unchainedshop/logger';

export const updateUserAvatarAfterUploadService: UpdateUserAvatarAfterUploadService = async (
  { file },
  context,
) => {
  const { modules, services } = context;
  const { userId } = file.meta as { userId: string };

  const files = await modules.files.findFiles({
    _id: { $ne: file._id },
    path: file.path,
    'meta.userId': userId,
  });
  const fileIds = files.map((f) => f._id);

  try {
    if (fileIds?.length) {
      await services.files.removeFiles(
        {
          fileIds,
        },
        context,
      );
    }
  } catch (e: unknown) {
    // cleanup error, not critical
    log(`could not clean up all old avatars: ${(e as Error).message}`, { level: LogLevel.Warning });
  }

  await modules.users.updateAvatar(userId, file._id);
};
