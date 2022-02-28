import { IFileAdapter, IFileDirector } from '@unchainedshop/types/files';
import { BaseDirector } from 'meteor/unchained:utils';

const FileUploadRegistry = new Map<string, (params: any) => Promise<any>>();

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
