import { log, LogLevel } from '@unchainedshop/logger';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { File, UploadFileData } from '@unchainedshop/types/files.js';
import { Readable } from 'stream';
import { IBaseAdapter } from '@unchainedshop/utils';

export interface IFileAdapter extends IBaseAdapter {
  createSignedURL: (
    directoryName: string,
    fileName: string,
    unchainedAPI: UnchainedCore,
  ) => Promise<(UploadFileData & { putURL: string }) | null>;
  removeFiles: (files: Array<File>, unchainedContext: UnchainedCore) => Promise<void>;
  uploadFileFromStream: (
    directoryName: string,
    rawFile: any,
    unchainedAPI: UnchainedCore,
  ) => Promise<UploadFileData | null>;
  uploadFileFromURL: (
    directoryName: string,
    fileInput: {
      fileLink: string;
      fileName: string;
      fileId?: string;
      headers?: Record<string, unknown>;
    },
    unchainedAPI: UnchainedCore,
  ) => Promise<UploadFileData | null>;
  createDownloadStream: (file: File, unchainedAPI: UnchainedCore) => Promise<Readable>;
}
export const FileAdapter: Omit<IFileAdapter, 'key' | 'label' | 'version'> = {
  createSignedURL() {
    return new Promise<null>((resolve) => {
      resolve(null);
    });
  },

  removeFiles() {
    return new Promise<void>((resolve) => {
      resolve();
    });
  },
  uploadFileFromStream() {
    return new Promise<null>((resolve) => {
      resolve(null);
    });
  },
  createDownloadStream() {
    return new Promise<null>((resolve) => {
      resolve(null);
    });
  },
  uploadFileFromURL() {
    return new Promise<null>((resolve) => {
      resolve(null);
    });
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
