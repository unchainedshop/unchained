export interface Options {
  fileId?: string;
  name?: string;
  fileName?: string;
  headers?: any;
  path?: string;
  meta?: any;
  type?: string;
  userId?: string;
  size?: number;
}

export interface Version {
  extension: string;
  size: number;
  type: string;
}

export interface FileObj {
  _id: string;

  size: number;

  name: string;

  type: string;

  ext?: string;

  extension?: string;

  extensionWithDot: string;

  downloadRoute: string;

  collectionName: string;

  public?: boolean;

  meta?: any;

  userId?: string;

  updatedAt?: Date;

  versions: {
    [propName: string]: Version;
  };

  mime: string;

  'mime-type': string;
}
export interface ExtensionObj {
  ext: string;
  extension: string;
  extensionWithDot: string;
}

export interface MediaObj {
  name: string;
  meta?: Record<string, unknown>;
  type: string;
  size: number;
  userId?: string;
  collectionName: string;
  extension: ExtensionObj;
  fileId: string;
}
