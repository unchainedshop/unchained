import { getFileFromFileData, getFileAdapter, File } from '@unchainedshop/core-files';
import { Modules } from '../modules.js';

export const uploadFileFromStreamService = async (
  { directoryName, rawFile, meta }: { directoryName: string; rawFile: any; meta?: any },
  unchainedAPI: { modules: Modules },
): Promise<File> => {
  const {
    modules: { files },
  } = unchainedAPI;
  const fileUploadAdapter = getFileAdapter();
  const uploadFileData = await fileUploadAdapter.uploadFileFromStream(
    directoryName,
    rawFile,
    unchainedAPI,
  );
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await files.create(fileData);
  return files.findFile({ fileId });
};
