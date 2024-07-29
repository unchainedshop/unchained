import { mongodb } from '@unchainedshop/mongodb';
import { getFileAdapter } from '../utils/getFileAdapter.js';
import { UnchainedCore } from '@unchainedshop/core';
import { File } from '../types.js';

export type RemoveFilesService = (
  params: { fileIds: Array<string> },
  unchainedAPI: UnchainedCore,
) => Promise<number>;

export const removeFilesService: RemoveFilesService = async ({ fileIds }, unchainedAPI) => {
  const {
    modules: { files },
  } = unchainedAPI;

  if (fileIds && typeof fileIds !== 'string' && !Array.isArray(fileIds))
    throw Error('Media id/s to be removed not provided as a string or array');

  const selector: mongodb.Filter<File> = {
    _id: { $in: fileIds },
  };

  const fileUploadAdapter = getFileAdapter();

  const fileObjects = await files.findFiles(selector);

  try {
    await fileUploadAdapter.removeFiles(fileObjects, unchainedAPI);
  } catch (e) {
    console.warn(e); // eslint-disable-line
  }

  const fileIdsToDelete = fileObjects.map((f) => f._id).filter(Boolean);

  await files.deleteMany(fileIdsToDelete);

  return fileIdsToDelete.length;
};
