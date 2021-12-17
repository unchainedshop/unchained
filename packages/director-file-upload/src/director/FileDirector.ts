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
const FileUploadRegistry = new Map<string, (params: any) => Promise<any>>();

export const FileDirector: IFileDirector = {
  setFileUploadAdapter: (adapter) => {
    Adapter = adapter;
  },

  getFileUploadAdapter: () => Adapter,

  registerFileUploadCallback(directoryName, fn) {
    if (!FileUploadRegistry.has(directoryName)) {
      FileUploadRegistry.set(directoryName, fn);
    }
  },

  getFileUploadCallback(directoryName) {
    return FileUploadRegistry.get(directoryName);
  },

  ...Adapter,
};
