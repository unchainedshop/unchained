import { BaseDirector } from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/core';
import { File } from '@unchainedshop/core-files';
import { IFileAdapter } from './FileAdapter.js';

export type UploadFileCallback = (file: File, unchainedAPI: UnchainedCore) => Promise<void>;

const FileUploadRegistry = new Map<string, UploadFileCallback>();

const baseDirector = BaseDirector<IFileAdapter>('FileDirector');

export const FileDirector = {
  ...baseDirector,

  registerFileUploadCallback(directoryName: string, fn: UploadFileCallback) {
    if (!FileUploadRegistry.has(directoryName)) {
      FileUploadRegistry.set(directoryName, fn);
    }
  },

  getFileUploadCallback(directoryName: string): UploadFileCallback {
    return FileUploadRegistry.get(directoryName);
  },
};
