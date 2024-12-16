import { Readable } from 'stream';
import { log, LogLevel } from '@unchainedshop/logger';
import { IBaseAdapter } from '@unchainedshop/utils';
import { UploadedFile, UploadFileData } from '../types.js';

export interface IFileAdapter<Context = unknown> extends IBaseAdapter {
  signUrl: (fileUrl: string, mediaId: string, expiry?: number) => Promise<string | null>;
  createSignedURL: (
    directoryName: string,
    fileName: string,
    isPrivate?: boolean,
  ) => Promise<(UploadFileData & { putURL: string; isPrivate: boolean }) | null>;
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
  signUrl() {
    if (this.key !== 'shop.unchained.file-upload-plugin.gridfs')
      throw new Error(`private media upload not supported by ${this.key} adapter`);
    return new Promise<string | null>((resolve) => {
      resolve(null);
    });
  },
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
