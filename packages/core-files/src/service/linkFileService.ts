import { FileDirector } from '@unchainedshop/file-upload';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { File } from '../types.js';

export type LinkFileService = (
  params: { fileId: string; size: number; type?: string },
  unchainedAPI: UnchainedCore,
) => Promise<File>;

export const linkFileService: LinkFileService = async ({ fileId, size, type }, unchainedAPI) => {
  const {
    modules: { files },
  } = unchainedAPI;
  const file = await files.findFile({ fileId });
  if (file?.expires) {
    await files.update(file._id, { size: size || file.size, type: type || file.type, expires: null });
    const callback = FileDirector.getFileUploadCallback(file.path);
    if (callback) {
      await callback(file, unchainedAPI);
    }
    return files.findFile({ fileId });
  }
  return file;
};
