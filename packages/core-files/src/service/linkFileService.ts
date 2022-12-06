import { LinkFileService } from '@unchainedshop/types/files';
import { FileDirector } from '@unchainedshop/file-upload';

export const linkFileService: LinkFileService = async ({ fileId, size, type }, unchainedAPI) => {
  const {
    modules: { files },
  } = unchainedAPI;
  const file = await files.findFile({ fileId });
  if (!file) throw new Error(`Media with id ${fileId} Not found`);
  await files.update(file._id, { size, type, expires: null });
  await FileDirector.getFileUploadCallback(file.path)(file, unchainedAPI);
  return files.findFile({ fileId });
};
