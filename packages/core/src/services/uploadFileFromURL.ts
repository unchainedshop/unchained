import { getFileFromFileData, getFileAdapter, File } from '@unchainedshop/core-files';
import { Modules } from '../modules.js';

export async function uploadFileFromURLService(
  this: Modules,
  {
    directoryName,
    fileInput,
    meta,
  }: {
    directoryName: string;
    fileInput: {
      fileLink: string;
      fileName: string;
      fileId?: string;
      headers?: Record<string, unknown>;
    };
    meta?: any;
  },
): Promise<File> {
  const fileUploadAdapter = getFileAdapter();

  const uploadFileData = await fileUploadAdapter.uploadFileFromURL(directoryName, fileInput, {
    modules: this,
  });
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await this.files.create(fileData);
  return this.files.findFile({ fileId });
}
