import { LinkFileService } from '@unchainedshop/types/files';
import { FileDirector } from 'meteor/unchained:core-file-upload';

export const linkFileService: LinkFileService = async ({ fileId, size, type }, { modules, userId }) => {
  const file = await modules.files.findFile({ fileId });

  if (!file) throw new Error(`Media with id ${fileId} Not found`);
  // if (!file.meta.mediaId) return null;

  const [directoryName] = decodeURIComponent(file.externalId).split('/');

  await modules.files.update(file._id, { size, type, expires: null }, userId);

  await FileDirector.getFileUploadCallback(directoryName)(file);

  return modules.files.findFile({ fileId });
};
