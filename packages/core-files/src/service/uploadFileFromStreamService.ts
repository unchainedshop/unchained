import { UnchainedCore } from '@unchainedshop/types/core.js';
import { getFileAdapter } from '../utils/getFileAdapter.js';
import { getFileFromFileData } from '../utils/getFileFromFileData.js';
import { File } from '../types.js';

export type UploadFileFromStreamService = (
  params: { directoryName: string; rawFile: any; meta?: any },
  unchainedAPI: UnchainedCore,
) => Promise<File>;

export const uploadFileFromStreamService: UploadFileFromStreamService = async (
  { directoryName, rawFile, meta },
  unchainedContext,
) => {
  const {
    modules: { files },
  } = unchainedContext;
  const fileUploadAdapter = getFileAdapter();
  const uploadFileData = await fileUploadAdapter.uploadFileFromStream(
    directoryName,
    rawFile,
    unchainedContext,
  );
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await files.create(fileData);
  return files.findFile({ fileId });
};
