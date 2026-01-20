import { type File } from '@unchainedshop/core-files';
import { getFileAdapter } from '../utils/getFileAdapter.ts';
import type { Modules } from '../modules.ts';

export async function createFileDownloadURLService(
  this: Modules,
  {
    file,
    expires,
    params = {},
  }: {
    file: File;
    expires?: number;
    params?: Record<string, any>;
  },
): Promise<string | null> {
  if (!file) return null;

  const fileUploadAdapter = getFileAdapter();
  const url = await fileUploadAdapter.createDownloadURL(file, expires);
  if (!url) return null;

  return this.files.normalizeUrl(url, params);
}
