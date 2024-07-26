import { Readable } from 'stream';
import type { FindOptions } from 'mongodb';
import { ModuleMutations, UnchainedCore } from './core.js';
import type { TimestampFields } from '@unchainedshop/mongodb';

export type File = {
  _id?: string;
  expires?: Date;
  path: string;
  meta?: Record<string, unknown>;
  name: string;
  size?: number;
  type?: string;
  url?: string;
} & TimestampFields;

export type SignedFileUpload = File & {
  putURL: string;
};

/*
 * Module
 */

export type FilesModule = ModuleMutations<File> & {
  // Query
  findFile: (params: { fileId?: string }, options?: FindOptions) => Promise<File>;

  getUrl: (file: File, params: Record<string, any>) => string | null;

  findFiles: (selector: any, options?: FindOptions) => Promise<Array<File>>;

  deleteMany: (fileIds: Array<string>) => Promise<number>;
};

/*
 * Services
 */

export type LinkFileService = (
  params: { fileId: string; size: number; type?: string },
  unchainedAPI: UnchainedCore,
) => Promise<File>;

export type CreateSignedURLService = (
  params: { directoryName: string; fileName: string; meta?: any },
  unchainedAPI: UnchainedCore,
) => Promise<SignedFileUpload>;

export type UploadFileFromStreamService = (
  params: { directoryName: string; rawFile: any; meta?: any },
  unchainedAPI: UnchainedCore,
) => Promise<File>;

export type RemoveFilesService = (
  params: { fileIds: Array<string> },
  unchainedAPI: UnchainedCore,
) => Promise<number>;

export type UploadFileFromURLService = (
  params: {
    directoryName: string;
    fileInput: {
      fileLink: string;
      fileName: string;
      fileId?: string;
      headers?: Record<string, unknown>;
    };
    meta?: any;
  },
  unchainedAPI: UnchainedCore,
) => Promise<File>;

export type CreateDownloadStreamService = (
  params: {
    fileId: string;
  },
  unchainedAPI: UnchainedCore,
) => Promise<Readable>;

export interface FileServices {
  linkFile: LinkFileService;
  uploadFileFromStream: UploadFileFromStreamService;
  uploadFileFromURL: UploadFileFromURLService;
  createSignedURL: CreateSignedURLService;
  removeFiles: RemoveFilesService;
  createDownloadStream: CreateDownloadStreamService;
}

/*
 * Director
 */

export interface UploadFileData {
  _id?: string;
  directoryName: string;
  expiryDate: Date;
  fileName: string;
  hash: string;
  hashedName: string;
  size?: number;
  type: string;
  url: string;
}

/* Settings */

export interface FilesSettingsOptions {
  transformUrl?: (url: string, params: Record<string, any>) => string;
}

export interface FilesSettings {
  transformUrl?: (url: string, params: Record<string, any>) => string;
  configureSettings: (options?: FilesSettingsOptions) => void;
}
