import type { File } from '@unchainedshop/core-files';
import { removeFilesService } from './removeFiles.ts';
import type { Modules } from '../modules.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core');

export async function updateUserAvatarAfterUploadService(
  this: Modules,
  { file }: { file: Pick<File, '_id' | 'path' | 'meta'> },
) {
  const { userId } = file.meta as { userId: string };

  const files = await this.files.findFiles({
    _id: { $ne: file._id },
    path: file.path,
    'meta.userId': userId,
  });
  const fileIds = files.map((f) => f._id);

  try {
    if (fileIds?.length) {
      await removeFilesService.bind(this)({
        fileIds,
      });
    }
  } catch (e: unknown) {
    // cleanup error, not critical
    logger.warn(`could not clean up all old avatars: ${(e as Error).message}`);
  }

  await this.users.updateAvatar(userId, file._id);
}
