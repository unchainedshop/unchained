import { BaseDirector } from '@unchainedshop/utils';
import type { IFileAdapter } from './FileAdapter.ts';
import type { UploadedFile } from '../types.ts';

export type UploadFileCallback<UnchainedAPI = unknown> = (
  file: UploadedFile,
  unchainedAPI: UnchainedAPI,
) => Promise<void>;

const FileUploadRegistry = new Map<string, UploadFileCallback>();

const baseDirector = BaseDirector<IFileAdapter>('FileDirector');

export const FileDirector = {
  ...baseDirector,

  registerFileUploadCallback<UnchainedAPI>(directoryName: string, fn: UploadFileCallback<UnchainedAPI>) {
    if (!FileUploadRegistry.has(directoryName)) {
      FileUploadRegistry.set(directoryName, fn);
    }
  },

  getFileUploadCallback(directoryName: string) {
    return FileUploadRegistry.get(directoryName) || null;
  },
};
