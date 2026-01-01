import { getFileFromFileData, getFileAdapter } from '@unchainedshop/core-files';
import { validateExternalUrl } from '@unchainedshop/utils';
import type { Modules } from '../modules.ts';

export async function uploadFileFromURLService(
  this: Modules,
  {
    directoryName,
    fileInput,
    meta,
  }: {
    directoryName: string;
    fileInput: {
      fileLink: string;
      fileName: string;
      fileId?: string;
      headers?: Record<string, unknown>;
    };
    meta?: any;
  },
) {
  // Validate URL at service level to prevent SSRF attacks
  // This ensures all adapters receive a validated URL
  const validatedUrl = validateExternalUrl(fileInput.fileLink);

  const fileUploadAdapter = getFileAdapter();

  const uploadFileData = await fileUploadAdapter.uploadFileFromURL(
    directoryName,
    {
      ...fileInput,
      fileLink: validatedUrl.href,
    },
    {
      modules: this,
    },
  );
  const fileData = getFileFromFileData(uploadFileData, meta);
  const fileId = await this.files.create(fileData);
  return this.files.findFile({ fileId });
}
