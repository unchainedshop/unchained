import { getFileFromFileData, getFileAdapter, SignedFileUpload } from '@unchainedshop/core-files';
import { Modules } from '../modules.js';

export async function createSignedURLService(
  this: Modules,
  { directoryName, fileName, meta }: { directoryName: string; fileName: string; meta?: any },
) {
  const fileUploadAdapter = getFileAdapter();
  const preparedFileData = await fileUploadAdapter.createSignedURL(directoryName, fileName, {
    modules: this,
  });
  const fileData = getFileFromFileData(preparedFileData, meta);
  const fileId = await this.files.create(fileData);
  const file = await this.files.findFile({ fileId });

  return {
    ...file,
    putURL: preparedFileData.putURL as string,
  } as SignedFileUpload;
}
