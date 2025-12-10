import type { UploadFileData } from '@unchainedshop/file-upload';

export const getFileFromFileData = (fileData: UploadFileData, meta: any) => ({
  _id: fileData._id,
  path: fileData.directoryName,
  expires: fileData.expiryDate || null,
  name: fileData.fileName,
  size: fileData.size,
  type: fileData.type || 'application/octet-stream',
  url: fileData.url,
  meta,
});

export default getFileFromFileData;
