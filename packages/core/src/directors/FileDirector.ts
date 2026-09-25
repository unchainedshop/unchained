import type { IFileAdapter, UploadedFile } from '@unchainedshop/core-files';
import { FileAdapter } from '@unchainedshop/core-files';
import { registryDirector } from './registryDirector.ts';

export type UploadFileCallback<UnchainedAPI = unknown> = (
  file: UploadedFile,
  unchainedAPI: UnchainedAPI,
) => Promise<void>;

const FileUploadRegistry = new Map<string, UploadFileCallback>();

export const FileDirector = {
  ...registryDirector<IFileAdapter>(FileAdapter.adapterType!),

  registerFileUploadCallback<UnchainedAPI>(directoryName: string, fn: UploadFileCallback<UnchainedAPI>) {
    if (!FileUploadRegistry.has(directoryName)) {
      FileUploadRegistry.set(directoryName, fn);
    }
  },

  getFileUploadCallback(directoryName: string) {
    return FileUploadRegistry.get(directoryName) || null;
  },
};
