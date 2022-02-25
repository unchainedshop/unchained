import { Context } from './api';
import {
  FindOptions,
  IBaseAdapter,
  IBaseDirector,
  ModuleMutations,
  TimestampFields,
  _ID,
} from './common';

export type File = {
  _id?: _ID;
  expires?: Date;
  externalId: string;
  meta?: Record<string, unknown>;
  name: string;
  size?: number;
  type?: string;
  url?: string;
} & TimestampFields;

/*
 * Module
 */

type UploadFileCallback = (file: File) => Promise<void>;

export type FilesModule = ModuleMutations<File> & {
  // Query
  findFile: (params: { fileId?: string; externalId?: string }, options?: FindOptions) => Promise<File>;

  findFilesByMetaData: (
    params: {
      meta: Record<string, any>;
    },
    options?: FindOptions,
  ) => Promise<Array<File>>;

  // Plugin
  createSignedURL: (
    {
      directoryName: string;
      fileName: string;
      meta: any;
      userId: string,
    },
    context: Context,
  ) => Promise<{
    _id: _ID;
    expires?: Date;
    externalId: string;
    putURL: string;
  } | null>;
  removeFiles: (params: {
    externalFileIds?: string | Array<string>;
    excludedFileIds?: Array<_ID>;
  }) => Promise<number>;
  uploadFileFromStream: (
    {
      directoryName: string;
      rawFile: any;
      meta: any;
      userId: string
    },
    context: Context,
  ) => Promise<File | null>;
  uploadFileFromURL: ({
    directoryName: string,
    fileInput: { fileLink: string; fileName: string },
    meta?: any,
    userId?: string,
  }, context: Context) => Promise<File | null>;
};

/*
 * Services
 */

export type LinkFileService = (
  { fileId: string; size: number; type: string },
  context: Context,
) => Promise<File>;

export interface FileServices {
  linkFile: LinkFileService;
}

/*
 * Director
 */

export interface UploadFileData {
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
  createSignedURL: (directoryName: string, fileName: string, unchainedContext: Context) => Promise<UploadFileData | null>;
  removeFiles: (composedFileIds: Array<string>, unchainedContext: Context) => Promise<void>;
  uploadFileFromStream: (directoryName: string, rawFile: any, unchainedContext: Context) => Promise<UploadFileData | null>;
  uploadFileFromURL: (
    directoryName: string,
    fileInput: { fileLink: string; fileName: string },
    unchainedContext: Context
  ) => Promise<UploadFileData | null>;
}

export type IFileDirector = IBaseDirector<IFileAdapter> & {
  registerFileUploadCallback: (directoryName: string, callback: UploadFileCallback) => void;
  getFileUploadCallback: (directoryName: string) => UploadFileCallback;
};
