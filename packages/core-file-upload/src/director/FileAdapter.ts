import { IFileAdapter } from '@unchainedshop/types/files';
import { log, LogLevel } from 'meteor/unchained:logger';

export const FileAdapter: Omit<IFileAdapter, 'key' | 'label' | 'version'> = {
  composeFileName() {
    return '';
  },
  createSignedURL() {
    return new Promise<null>((resolve) => resolve(null));
  },

  removeFiles() {
    return new Promise<void>((resolve) => resolve());
  },
  uploadFileFromStream() {
    return new Promise<null>((resolve) => resolve(null));
  },
  uploadFileFromURL() {
    return new Promise<null>((resolve) => resolve(null));
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
