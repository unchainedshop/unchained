import { getFileFromFileData, getFileAdapter, type File } from '@unchainedshop/core-files';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';

export async function uploadFileFromStreamService(
  this: Modules,
  {
    directoryName,
    rawFile,
    meta,
    ...options
  }: { directoryName: string; rawFile: any; meta?: any } & Record<string, any>,
): Promise<File> {
  const fileUploadAdapter = getFileAdapter();
  const uploadFileData = await fileUploadAdapter.uploadFileFromStream(
    directoryName,
    rawFile,
    {
      modules: this,
    },
    options,
  );
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await this.files.create(fileData);
  const file = await this.files.findFile({ fileId });
  if (!file) throw createServiceError('FileNotFoundError', 'File not found after upload');
  return file;
}
