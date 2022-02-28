import { Query } from '@unchainedshop/types/common';
import { RemoveFilesService } from '@unchainedshop/types/files';
import { getFileAdapter } from '../utils/getFileAdapter';

export const removeFilesService: RemoveFilesService = async ({ fileIds }, requestContext) => {
  const {
    modules: { files },
    userId,
  } = requestContext;

  if (fileIds && typeof fileIds !== 'string' && !Array.isArray(fileIds))
    throw Error('Media id/s to be removed not provided as a string or array');

  const selector: Query = {
    _id: { $in: fileIds },
  };

  const fileUploadAdapter = getFileAdapter();

  const fileObjects = await files.findFiles(selector);

  try {
    await fileUploadAdapter.removeFiles(fileObjects, requestContext);
  } catch (e) {
    console.warn(e);
  }

  const fileIdsToDelete = fileObjects.map((f) => f._id).filter(Boolean);

  await files.deleteMany(fileIdsToDelete, userId);

  return fileIdsToDelete.length;
};
