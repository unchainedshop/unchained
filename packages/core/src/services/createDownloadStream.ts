import { getFileAdapter } from '@unchainedshop/core-files';
import { Modules } from '../modules.js';

export async function createDownloadStreamService(
  this: Modules,
  {
    fileId,
  }: {
    fileId: string;
  },
) {
  const fileAdapter = getFileAdapter();
  const file = await this.files.findFile({ fileId });
  if (!file) return null;
  const stream = fileAdapter.createDownloadStream(file, { modules: this });
  return stream;
}
