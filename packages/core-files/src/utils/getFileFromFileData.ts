import { UploadFileData } from '@unchainedshop/file-upload';

export const getFileFromFileData = (fileData: UploadFileData, meta: any) => ({
  _id: fileData._id,
  path: fileData.directoryName,
  expires: fileData.expiryDate,
  name: fileData.fileName,
  size: fileData.size,
  type: fileData.type || 'application/octet-stream',
  url: fileData.url,
  isPrivate: !!meta?.isPrivate,
  meta,
});

export default getFileFromFileData;
