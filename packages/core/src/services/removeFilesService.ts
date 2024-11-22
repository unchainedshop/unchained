import { FilesModule, getFileAdapter } from '@unchainedshop/core-files';

export type RemoveFilesService = (
  params: { fileIds: Array<string> },
  unchainedAPI: { modules: { files: FilesModule } },
) => Promise<number>;

export const removeFilesService: RemoveFilesService = async ({ fileIds }, unchainedAPI) => {
  const {
    modules: { files },
  } = unchainedAPI;

  if (fileIds && typeof fileIds !== 'string' && !Array.isArray(fileIds))
    throw Error('Media id/s to be removed not provided as a string or array');

  const fileUploadAdapter = getFileAdapter();

  const fileObjects = await files.findFiles({
    _id: { $in: fileIds },
  });

  try {
    await fileUploadAdapter.removeFiles(fileObjects, unchainedAPI);
  } catch (e) {
    console.warn(e); // eslint-disable-line
  }

  const fileIdsToDelete = fileObjects.map((f) => f._id).filter(Boolean);

  await files.deleteMany(fileIdsToDelete);

  return fileIdsToDelete.length;
};
