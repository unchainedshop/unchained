import {
  getFileFromFileData,
  getFileAdapter,
  SignedFileUpload,
  FilesModule,
} from '@unchainedshop/core-files';

export type CreateSignedURLService = (
  params: { directoryName: string; fileName: string; meta?: any; isPrivate?: boolean },
  unchainedAPI: { userId?: string; modules: { files: FilesModule } },
) => Promise<SignedFileUpload>;

export const createSignedURLService: CreateSignedURLService = async (
  { directoryName, fileName, meta, isPrivate },
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
    Boolean(isPrivate),
  );
  const fileData = getFileFromFileData(preparedFileData, {
    ...meta,
    authorId: unchainedContext?.userId,
  });
  const fileId = await files.create(fileData);
  const file = await files.findFile({ fileId });

  return {
    ...file,
    putURL: preparedFileData.putURL as string,
  };
};
