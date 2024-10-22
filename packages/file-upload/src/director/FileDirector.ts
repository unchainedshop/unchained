import { BaseDirector } from '@unchainedshop/utils';
import { IFileAdapter } from './FileAdapter.js';
import { UploadedFile } from '../types.js';

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

  getFileUploadCallback(directoryName: string): UploadFileCallback {
    return FileUploadRegistry.get(directoryName);
  },
};
