export interface UploadFileData {
  _id: string;
  directoryName: string;
  expiryDate: Date | null;
  fileName: string;
  size?: number;
  type: string;
  url: string;
}

export interface UploadedFile {
  _id: string;
  path: string;
  meta?: Record<string, unknown>;
  name: string;
  size?: number;
  type?: string;
  url?: string;
}
