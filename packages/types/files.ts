import { Context } from './api';
import { FindOptions, IBaseAdapter, IBaseDirector, TimestampFields, _ID } from './common';
import { ModuleMutations, UnchainedCore } from './core';

export type File = {
  _id?: _ID;
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

export type UploadFileCallback = (file: File, context: Context) => Promise<void>;

export type FilesModule = ModuleMutations<File> & {
  // Query
  findFile: (params: { fileId?: string }, options?: FindOptions) => Promise<File>;

  getUrl: (file: File, params: Record<string, any>) => string | null;

  findFiles: (selector: any, options?: FindOptions) => Promise<Array<File>>;

  deleteMany: (fileIds: Array<_ID>) => Promise<void>;
};

/*
 * Services
 */

export type LinkFileService = (
  params: { fileId: string; size: number; type: string },
  context: Context,
) => Promise<File>;

export type CreateSignedURLService = (
  params: { directoryName: string; fileName: string; meta?: any; userId?: string },
  context: Context,
) => Promise<SignedFileUpload>;

export type UploadFileFromStreamService = (
  params: { directoryName: string; rawFile: any; meta?: any; userId?: string },
  context: Context,
) => Promise<File>;

export type RemoveFilesService = (
  params: { fileIds: Array<_ID> },
  unchainedAPI: UnchainedCore,
) => Promise<number>;

export type UploadFileFromURLService = (
  params: {
    directoryName: string;
    fileInput: { fileLink: string; fileName: string; headers?: Record<string, unknown> };
    meta?: any;
    userId?: string;
  },
  context: Context,
) => Promise<File>;

export interface FileServices {
  linkFile: LinkFileService;
  uploadFileFromStream: UploadFileFromStreamService;
  uploadFileFromURL: UploadFileFromURLService;
  createSignedURL: CreateSignedURLService;
  removeFiles: RemoveFilesService;
}

/*
 * Director
 */

export interface UploadFileData {
  _id?: _ID;
  directoryName: string;
  expiryDate: Date;
  fileName: string;
  hash: string;
  hashedName: string;
  size?: number;
  type: string;
  url: string;
}

export interface IFileAdapter extends IBaseAdapter {
  createSignedURL: (
    directoryName: string,
    fileName: string,
    unchainedContext: Context,
  ) => Promise<(UploadFileData & { putURL: string }) | null>;
  removeFiles: (files: Array<File>, unchainedContext: UnchainedCore) => Promise<void>;
  uploadFileFromStream: (
    directoryName: string,
    rawFile: any,
    unchainedContext: Context,
  ) => Promise<UploadFileData | null>;
  uploadFileFromURL: (
    directoryName: string,
    fileInput: { fileLink: string; fileName: string; headers?: Record<string, unknown> },
    unchainedContext: Context,
  ) => Promise<UploadFileData | null>;
}

export type IFileDirector = IBaseDirector<IFileAdapter> & {
  registerFileUploadCallback: (directoryName: string, callback: UploadFileCallback) => void;
  getFileUploadCallback: (directoryName: string) => UploadFileCallback;
};

/* Settings */

export interface FilesSettingsOptions {
  transformUrl?: (url: string, params: Record<string, any>) => string;
}

export interface FilesSettings {
  transformUrl?: (url: string, params: Record<string, any>) => string;
  configureSettings: (options?: FilesSettingsOptions) => void;
}
