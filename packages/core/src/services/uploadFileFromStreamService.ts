import { getFileFromFileData, getFileAdapter, File, FilesModule } from '@unchainedshop/core-files';

export type UploadFileFromStreamService = (
  params: { directoryName: string; rawFile: any; meta?: any },
  unchainedAPI: { modules: { files: FilesModule } },
) => Promise<File>;

export const uploadFileFromStreamService: UploadFileFromStreamService = async (
  { directoryName, rawFile, meta },
  unchainedContext,
) => {
  const {
    modules: { files },
  } = unchainedContext;
  const fileUploadAdapter = getFileAdapter();
  const uploadFileData = await fileUploadAdapter.uploadFileFromStream(
    directoryName,
    rawFile,
    unchainedContext,
  );
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await files.create(fileData);
  return files.findFile({ fileId });
};
