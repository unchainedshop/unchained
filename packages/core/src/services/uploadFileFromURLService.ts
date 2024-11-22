import { getFileFromFileData, getFileAdapter, FilesModule, File } from '@unchainedshop/core-files';

export type UploadFileFromURLService = (
  params: {
    directoryName: string;
    fileInput: {
      fileLink: string;
      fileName: string;
      fileId?: string;
      headers?: Record<string, unknown>;
    };
    meta?: any;
  },
  unchainedAPI: { modules: { files: FilesModule } },
) => Promise<File>;

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
