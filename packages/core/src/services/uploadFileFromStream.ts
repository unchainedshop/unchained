import { getFileFromFileData, getFileAdapter, File } from '@unchainedshop/core-files';
import { Modules } from '../modules.js';

export async function uploadFileFromStreamService(
  this: Modules,
  { directoryName, rawFile, meta }: { directoryName: string; rawFile: any; meta?: any },
): Promise<File> {
  const fileUploadAdapter = getFileAdapter();
  const uploadFileData = await fileUploadAdapter.uploadFileFromStream(directoryName, rawFile, {
    modules: this,
  });
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await this.files.create(fileData);
  return this.files.findFile({ fileId });
}
