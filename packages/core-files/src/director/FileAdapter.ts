import type { Readable } from 'node:stream';
import { BaseAdapter, type IBaseAdapter } from '@unchainedshop/utils';
import type { UploadedFile, UploadFileData } from '../file-types.ts';

export interface IFileAdapter<Context = unknown> extends IBaseAdapter {
  createDownloadURL: (file: UploadedFile, expiry?: number) => Promise<string | null>;
  createSignedURL: (
    directoryName: string,
    fileName: string,
    unchainedAPI: Context,
  ) => Promise<(UploadFileData & { putURL: string }) | null>;
  removeFiles: (files: UploadedFile[], unchainedContext: Context) => Promise<void>;
  uploadFileFromStream: (
    directoryName: string,
    rawFile: any,
    unchainedAPI: Context,
    options?: Record<string, any>,
  ) => Promise<UploadFileData>;
  uploadFileFromURL: (
    directoryName: string,
    fileInput: {
      fileLink: string;
      fileName: string;
      fileId?: string;
      headers?: Record<string, unknown>;
    },
    unchainedAPI: Context,
  ) => Promise<UploadFileData>;
  createDownloadStream: (file: UploadedFile, unchainedAPI: Context) => Promise<Readable>;
}
export const FileAdapter: Omit<IFileAdapter, 'key' | 'label' | 'version'> = {
  ...BaseAdapter,
  adapterType: Symbol.for('unchained:adapter:file'),

  async createSignedURL() {
    throw new Error('Method not implemented');
  },
  async removeFiles() {
    throw new Error('Method not implemented');
  },
  async createDownloadURL() {
    throw new Error('Method not implemented');
  },
  async uploadFileFromStream() {
    throw new Error('Method not implemented');
  },
  async createDownloadStream() {
    throw new Error('Method not implemented');
  },
  async uploadFileFromURL() {
    throw new Error('Method not implemented');
  },
};
