import { Readable } from 'stream';
import { log, LogLevel } from '@unchainedshop/logger';
import { IBaseAdapter } from '@unchainedshop/utils';
import { UploadedFile, UploadFileData } from '../types.js';

export interface IFileAdapter<Context = unknown> extends IBaseAdapter {
  createSignedURL: (
    directoryName: string,
    fileName: string,
    unchainedAPI: Context,
  ) => Promise<(UploadFileData & { putURL: string }) | null>;
  removeFiles: (files: Array<UploadedFile>, unchainedContext: Context) => Promise<void>;
  uploadFileFromStream: (
    directoryName: string,
    rawFile: any,
    unchainedAPI: Context,
  ) => Promise<UploadFileData | null>;
  uploadFileFromURL: (
    directoryName: string,
    fileInput: {
      fileLink: string;
      fileName: string;
      fileId?: string;
      headers?: Record<string, unknown>;
    },
    unchainedAPI: Context,
  ) => Promise<UploadFileData | null>;
  createDownloadStream: (file: UploadedFile, unchainedAPI: Context) => Promise<Readable>;
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
