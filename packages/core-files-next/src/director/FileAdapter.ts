import { Context } from '@unchainedshop/types/api';
import { File } from '@unchainedshop/types/files';

interface UploadFileData {
  hashedName: string;
  hash: string;
  size: number;
  type: string;
  fileName: string;
}

interface SignedPutURLData {
  putURL: string;
  hash: string;
  hashedName: string;
}

interface IFileAdapter {
  removeFiles: (fileIds: string | Array<string>) => Promise<boolean>;
  uploadObjectStream: (
    directoryName: string,
    rawFile: any
  ) => Promise<UploadFileData | null>;
  uploadFileFromURL(
    directoryName: string,
    file: { fileLink: string; fileName: string }
  ): Promise<UploadFileData | null>;

  registerUploadContainer(
    directoryName: string,
    fn: (params: any) => Promise<any>
  ): {
    createSignedURL: (fileName: string) => Promise<SignedPutURLData | null>;
  };
}

export class FileAdapter implements IFileAdapter {
  private context
  
  constructor(context: Context) {
    this.context = context
  }

  removeFiles() {
    return new Promise<boolean>((resolve) => resolve(true));
  }
  uploadObjectStream() {
    return new Promise<null>((resolve) => resolve(null));
  }
  uploadFileFromURL() {
    return new Promise<null>((resolve) => resolve(null));
  }
  registerUploadContainer() {
    return {
      createSignedURL: () => {
        return new Promise<null>((resolve) => resolve(null));
      },
    };
  }
}
