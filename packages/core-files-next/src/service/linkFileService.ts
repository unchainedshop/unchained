import { Context } from '@unchainedshop/types/api';
import { File } from '@unchainedshop/types/files';
import { FileDirector } from '../director/FileDirector';

export type LinkFileService = (
  params: { externalFileId: string; size: number; type: string },
  context: Context
) => Promise<File>;

export const linkFileService = async (
  { externalFileId, size, type },
  { modules, userId }
) => {
  const file = await modules.files.findFile({ externalFileId });

  if (!file)
    throw new Error(`Media with external id ${externalFileId} Not found`);

  const { meta } = file;
  const { mediaId, ...mediaMeta } = meta;
  if (!mediaId) return null;

  const [directoryName] = decodeURIComponent(externalFileId).split('/');

  await modules.files.update(file._id, {
    $set: {
      size,
      type,
      expires: null,
      updated: new Date(),
    },
  });

  await FileDirector.getFileUploadCallback(directoryName)(file);

  return await modules.files.findFile({ fileId: file._id });
};
