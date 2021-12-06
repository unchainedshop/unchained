import { Context } from '@unchainedshop/types/api';
import { File } from '@unchainedshop/types/files';
import { getFileUploadCallback } from 'meteor/unchained:file-upload';

export type LinkFileService = (
  params: { externalId: string; size: number; type: string },
  context: Context
) => Promise<File>;

export const linkFileService = async (
  { externalId, size, type },
  { modules, userId }
) => {
  const file = await modules.files.findFile({ externalId });

  if (!file) throw new Error(`Media with external id ${externalId} Not found`);
  if (!file.meta.mediaId) return null;

  const [directoryName] = decodeURIComponent(externalId).split('/');

  await modules.files.update(file._id, {
    $set: {
      size,
      type,
      expires: null,
      updated: new Date(),
    },
  });

  await getFileUploadCallback(directoryName)(file);

  return await modules.files.findFile({ fileId: file._id });
};
