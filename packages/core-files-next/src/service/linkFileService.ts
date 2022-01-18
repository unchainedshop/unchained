import { LinkFileService } from '@unchainedshop/types/files';
import { getFileUploadCallback } from 'meteor/unchained:director-file-upload';

export const linkFileService: LinkFileService = async (
  { externalId, size, type },
  { modules }
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
