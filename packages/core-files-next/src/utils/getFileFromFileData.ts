import { UploadFileData } from '@unchainedshop/types/files';

export const getFileFromFileData = (fileData: UploadFileData, meta: any) => ({
  _id: fileData._id,
  path: fileData.directoryName,
  expires: fileData.expiryDate,
  name: fileData.fileName,
  size: fileData.size,
  type: fileData.type || undefined,
  url: fileData.url,
  meta,
});
