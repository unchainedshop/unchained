import { IFileAdapter, IFileDirector, UploadFileCallback } from '@unchainedshop/types/files';
import { BaseDirector } from '@unchainedshop/utils';

const FileUploadRegistry = new Map<string, UploadFileCallback>();

const baseDirector = BaseDirector<IFileAdapter>('FileDirector');

export const FileDirector: IFileDirector = {
  ...baseDirector,

  registerFileUploadCallback(directoryName, fn) {
    if (!FileUploadRegistry.has(directoryName)) {
      FileUploadRegistry.set(directoryName, fn);
    }
  },

  getFileUploadCallback(directoryName) {
    return FileUploadRegistry.get(directoryName);
  },
};
