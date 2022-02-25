import { CreateSignedURLService } from '@unchainedshop/types/files';
import { getFileAdapter } from '../utils/getFileAdapter';
import { getFileFromFileData } from '../utils/getFileFromFileData';

export const createSignedURLService: CreateSignedURLService = async (
  { directoryName, fileName, meta, userId },
  unchainedContext,
) => {
  const {
    modules: { files },
  } = unchainedContext;
  const fileUploadAdapter = getFileAdapter();
  const preparedFileData = await fileUploadAdapter.createSignedURL(
    directoryName,
    fileName,
    unchainedContext,
  );
  const fileData = getFileFromFileData(preparedFileData, meta);
  const fileId = await files.create(fileData, userId);
  return files.findFile({ fileId });
};
