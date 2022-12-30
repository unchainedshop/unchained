import { UploadFileFromURLService } from '@unchainedshop/types/files';
import { getFileAdapter } from "../utils/getFileAdapter.js";
import { getFileFromFileData } from "../utils/getFileFromFileData.js";

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
