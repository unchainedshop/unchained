import { LinkFileService } from '@unchainedshop/types/files';
import { FileDirector } from 'meteor/unchained:file-upload';

export const linkFileService: LinkFileService = async ({ fileId, size, type }, requestContext) => {
  const {
    modules: { files },
    userId,
  } = requestContext;
  const file = await files.findFile({ fileId });
  if (!file) throw new Error(`Media with id ${fileId} Not found`);
  await files.update(file._id, { size, type, expires: null }, userId);
  await FileDirector.getFileUploadCallback(file.path)(file, requestContext);
  return files.findFile({ fileId });
};
