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
  findFile: (
    params: { fileId?: string; externalFileId?: string },
    options?: FindOptions
  ) => Promise<File>;
};

export interface IFileAdapter {
  removeFiles: (fileIds: string | Array<string>) => Promise<boolean>;
  uploadObjectStream: (
    directoryName: string,
    rawFile: any
  ) => Promise<{
    hashedName: string;
    hash: string;
    size: number;
    type: string;
    fileName: string;
  } | null>;
}