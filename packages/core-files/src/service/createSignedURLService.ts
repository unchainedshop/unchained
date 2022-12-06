import { CreateSignedURLService } from '@unchainedshop/types/files';
import { getFileAdapter } from '../utils/getFileAdapter';
import { getFileFromFileData } from '../utils/getFileFromFileData';

export const createSignedURLService: CreateSignedURLService = async (
  { directoryName, fileName, meta },
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
  const fileId = await files.create(fileData);
  const file = await files.findFile({ fileId });

  return {
    ...file,
    putURL: preparedFileData.putURL as string,
  };
};
