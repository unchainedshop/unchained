import { File } from '@unchainedshop/core-files';
import { removeFilesService } from './removeFiles.js';
import { Modules } from '../modules.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core');

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
    logger.warn(`could not clean up all old avatars: ${(e as Error).message}`);
  }

  await modules.users.updateAvatar(userId, file._id);
};
