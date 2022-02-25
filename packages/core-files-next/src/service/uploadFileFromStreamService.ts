import { UploadFileFromStreamService } from '@unchainedshop/types/files';
import { getFileAdapter } from '../utils/getFileAdapter';
import { getFileFromFileData } from '../utils/getFileFromFileData';

export const uploadFileFromStreamService: UploadFileFromStreamService = async ({ directoryName, rawFile, meta, userId }, unchainedContext) => {
  const { modules: { files } } = unchainedContext;
  const fileUploadAdapter = getFileAdapter();
  const uploadFileData = await fileUploadAdapter.uploadFileFromStream(directoryName, rawFile, unchainedContext);
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await files.create(fileData, userId);
  return files.findFile({ fileId });
};
