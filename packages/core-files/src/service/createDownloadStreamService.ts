import { CreateSignedURLService } from '@unchainedshop/types/files.js';
import { getFileAdapter } from '../utils/getFileAdapter.js';

export const createDownloadStreamService: CreateSignedURLService = async (
  { directoryName, fileName },
  unchainedContext,
) => {
  const {
    modules: { files },
  } = unchainedContext;
  const fileAdapter = getFileAdapter();

  //   const preparedFileData = await fileUploadAdapter.createSignedURL(
  //     directoryName,
  //     fileName,
  //     unchainedContext,
  //   );
  //   const fileData = getFileFromFileData(preparedFileData, meta);
  //   const fileId = await files.create(fileData);
  //   const file = await files.findFile({ fileId });

  //   return {
  //     ...file,
  //     putURL: preparedFileData.putURL as string,
  //   };
};
