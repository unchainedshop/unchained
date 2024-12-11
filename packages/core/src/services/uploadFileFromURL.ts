import { getFileFromFileData, getFileAdapter, File } from '@unchainedshop/core-files';
import { Modules } from '../modules.js';

export const uploadFileFromURLService = async (
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
  unchainedAPI: { modules: Modules },
): Promise<File> => {
  const {
    modules: { files },
  } = unchainedAPI;
  const fileUploadAdapter = getFileAdapter();

  const uploadFileData = await fileUploadAdapter.uploadFileFromURL(
    directoryName,
    fileInput,
    unchainedAPI,
  );
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await files.create(fileData);
  return files.findFile({ fileId });
};
