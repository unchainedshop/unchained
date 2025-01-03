import { FileDirector } from '@unchainedshop/file-upload';
import { Modules } from '../modules.js';

export async function linkFileService(
  this: Modules,
  { fileId, size, type }: { fileId: string; size?: number; type?: string },
) {
  const file = await this.files.findFile({ fileId });
  await this.files.update(file._id, {
    size: size || file.size,
    type: type || file.type,
    expires: null,
  });
  if (file?.expires) {
    const callback = FileDirector.getFileUploadCallback(file.path);
    if (callback) {
      await callback(file, { modules: this });
    }
    return this.files.findFile({ fileId });
  }
  return file;
}
