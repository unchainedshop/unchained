export interface FileTypes {
  isVideo: boolean;
  isAudio: boolean;
  isImage: boolean;
  isText: boolean;
  isJSON: boolean;
  isPDF: boolean;
}

export interface Version {
  extension: string;
  path: string;
  size: number;
  type: string;
}

export interface FileObj {
  _id: string;

  size: number;

  name: string;

  type: string;

  path: string;

  isVideo: boolean;

  isAudio: boolean;

  isImage: boolean;

  isText: boolean;

  isJSON: boolean;

  isPDF: boolean;

  ext?: string;

  extension?: string;

  extensionWithDot: string;

  storagePath: string;

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
