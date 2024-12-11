import { File } from '@unchainedshop/core-files';
import { log, LogLevel } from '@unchainedshop/logger';
import { removeFilesService } from './removeFiles.js';
import { Modules } from '../modules.js';

export const updateUserAvatarAfterUploadService = async (
  { file }: { file: File },
  unchainedAPI: { modules: Modules },
): Promise<void> => {
  const { modules } = unchainedAPI;
  const { userId } = file.meta as { userId: string };

  const files = await modules.files.findFiles({
    _id: { $ne: file._id },
    path: file.path,
    'meta.userId': userId,
  });
  const fileIds = files.map((f) => f._id);

  try {
    if (fileIds?.length) {
      await removeFilesService(
        {
          fileIds,
        },
        unchainedAPI,
      );
    }
  } catch (e: unknown) {
    // cleanup error, not critical
    log(`could not clean up all old avatars: ${(e as Error).message}`, { level: LogLevel.Warning });
  }

  await modules.users.updateAvatar(userId, file._id);
};
