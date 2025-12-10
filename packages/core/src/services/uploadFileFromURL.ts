import { getFileFromFileData, getFileAdapter } from '@unchainedshop/core-files';
import type { Modules } from '../modules.ts';

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
) {
  const fileUploadAdapter = getFileAdapter();

  const uploadFileData = await fileUploadAdapter.uploadFileFromURL(directoryName, fileInput, {
    modules: this,
  });
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await this.files.create(fileData);
  return this.files.findFile({ fileId });
}
