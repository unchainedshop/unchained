import {
  FileAdapter,
  FileDirector as IFileDirector,
} from '@unchainedshop/types/files';

const DefaultFileAdapter: FileAdapter = {
  composeFileName() {
    return '';
  },
  createSignedURL() {
    return new Promise<null>((resolve) => resolve(null));
  },
  registerFileUploadCallback() {},
  getFileUploadCallback() {
    return () => new Promise((resolve) => resolve());
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
};

let Adapter: FileAdapter = DefaultFileAdapter;

export const FileDirector: IFileDirector = {
  setFileUploadAdapter: (adapter) => {
    Adapter = adapter;
  },

  getFileUploadAdapter: () => Adapter,

  ...Adapter,
};
