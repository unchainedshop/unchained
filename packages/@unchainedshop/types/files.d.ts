import {
  Filter,
  FindOptions,
  ModuleMutations,
  TimestampFields,
  _ID,
} from './common';

export type File = {
  _id?: _ID;
  expires?: Date;
  externalFileId: string;
  meta?: Record<string, unknown>;
  name: string;
  size?: string;
  type?: string;
  url?: string;
} & TimestampFields;

export type FilesModule = ModuleMutations<File> & {
  // Query
  findFile: (
    params: { fileId?: string; externalFileId?: string },
    options?: FindOptions
  ) => Promise<File>;
  // Plugin
  createSignedURL: (
    directoryName: string,
    fileName: string,
    meta: any,
  ) => Promise<File | null>;
  removeFiles: (fileIds: string | Array<string>) => Promise<number>;
  uploadFileFromStream: (
    directoryName: string,
    rawFile: any,
    meta?: any
  ) => Promise<File | null>;
  uploadFileFromURL: (
    directoryName: string,
    file: { fileLink: string; fileName: string },
    meta?: any
  ) => Promise<File | null>;
};

interface UploadFileData {
  directoryName: string;
  expiryDate: Date;
  fileName: string;
  hash: string;
  hashedName: string;
  size?: number;
  type: string;
  url: string;
}

interface SignedPutURLData {
  directoryName: string;
  expiryDate: Date;
  fileName: string;
  hash: string;
  hashedName: string;
  type: string;
  url: string;
}

type UploadFileCallback = (file: File) => Promise<void>;

export interface FileAdapter {
  composeFileName: (file: File) => string;
  createSignedURL: (
    directoryName: string,
    fileName: string
  ) => Promise<UploadFileData | null>;
  registerFileUploadCallback: (
    directoryName: string,
    callback: UploadFileCallback
  ) => void;
  getFileUploadCallback: (directoryName: string) => UploadFileCallback;
  removeFiles: (composedFileIds: Array<string>) => Promise<void>;
  uploadFileFromStream: (
    directoryName: string,
    rawFile: any
  ) => Promise<UploadFileData | null>;
  uploadFileFromURL: (
    directoryName: string,
    file: { fileLink: string; fileName: string }
  ) => Promise<UploadFileData | null>;
}

export interface FileDirector extends FileAdapter {
  setFileAdapter(adapter: FileAdapter): void;
  getFileAdapter(): FileAdapter;
}
