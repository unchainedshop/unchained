import { getFileAdapter } from '../utils/getFileAdapter.js';
import { getFileFromFileData } from '../utils/getFileFromFileData.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { File } from '../types.js';

export type UploadFileFromURLService = (
  params: {
    directoryName: string;
    fileInput: {
      fileLink: string;
      fileName: string;
      fileId?: string;
      headers?: Record<string, unknown>;
    };
    meta?: any;
  },
  unchainedAPI: UnchainedCore,
) => Promise<File>;

export const uploadFileFromURLService: UploadFileFromURLService = async (
  { directoryName, fileInput, meta },
  unchainedContext,
) => {
  const {
    modules: { files },
  } = unchainedContext;
  const fileUploadAdapter = getFileAdapter();

  const uploadFileData = await fileUploadAdapter.uploadFileFromURL(
    directoryName,
    fileInput,
    unchainedContext,
  );
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await files.create(fileData);
  return files.findFile({ fileId });
};
