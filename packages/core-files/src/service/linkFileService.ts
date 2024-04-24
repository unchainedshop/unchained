import { LinkFileService } from '@unchainedshop/types/files.js';
import { FileDirector } from '@unchainedshop/file-upload';

export const linkFileService: LinkFileService = async ({ fileId, size, type }, unchainedAPI) => {
  const {
    modules: { files },
  } = unchainedAPI;
  const file = await files.findFile({ fileId });
  if (!file) throw new Error(`Media with id ${fileId} Not found`);

  if (file.expires) {
    const currentDate = new Date();
    if (new Date(file.expires) < currentDate) {
      throw new Error('File link has expired');
    }
    await files.update(file._id, { size, type: type || file.type, expires: null });
    const callback = FileDirector.getFileUploadCallback(file.path);
    if (callback) {
      await callback(file, unchainedAPI);
    }
    return files.findFile({ fileId });
  }
  return file;
};
