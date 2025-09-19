import { getFileAdapter } from '@unchainedshop/core-files';
import { Modules } from '../modules.js';

export async function removeFilesService(this: Modules, { fileIds }: { fileIds: string[] }) {
  if (fileIds && typeof fileIds !== 'string' && !Array.isArray(fileIds))
    throw Error('Media id/s to be removed not provided as a string or array');

  const fileUploadAdapter = getFileAdapter();

  const fileObjects = await this.files.findFiles({
    _id: { $in: fileIds },
  });

  try {
    await fileUploadAdapter.removeFiles(fileObjects, { modules: this });
  } catch {
    /**/
  }

  const fileIdsToDelete = fileObjects.map((f) => f._id).filter(Boolean);

  await this.files.deleteMany(fileIdsToDelete);

  return fileIdsToDelete.length;
}
