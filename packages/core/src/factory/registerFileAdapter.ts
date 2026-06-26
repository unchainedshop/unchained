import {
  FileAdapter,
  type IFileAdapter,
  type UploadedFile,
  type UploadFileData,
} from '@unchainedshop/core-files';
import { type IPlugin } from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerFileAdapter<Context = unknown>({
  adapterId,
  createSignedURL,
  uploadFileFromStream,
  createDownloadURL,
  removeFiles,
  uploadFileFromURL,
}: {
  adapterId: string;
  createSignedURL: (
    directoryName: string,
    fileName: string,
    unchainedAPI: Context,
  ) => Promise<(UploadFileData & { putURL: string }) | null>;
  uploadFileFromStream: (
    directoryName: string,
    rawFile: any,
    unchainedAPI: Context,
    options?: Record<string, any>,
  ) => Promise<UploadFileData>;
  createDownloadURL?: (file: UploadedFile, expiry?: number) => Promise<string | null>;
  removeFiles?: (files: UploadedFile[], unchainedContext: Context) => Promise<void>;
  uploadFileFromURL?: (
    directoryName: string,
    fileInput: {
      fileLink: string;
      fileName: string;
      fileId?: string;
      headers?: Record<string, unknown>;
    },
    unchainedAPI: Context,
  ) => Promise<UploadFileData>;
}): IPlugin {
  const adapter: IFileAdapter<Context> = {
    ...FileAdapter,

    key: `shop.unchained.file-upload.${adapterId}`,
    label: 'File Adapter: ' + adapterId,
    version: '1.0.0',

    createSignedURL,
    uploadFileFromStream,
    ...(createDownloadURL ? { createDownloadURL } : {}),
    ...(removeFiles ? { removeFiles } : {}),
    ...(uploadFileFromURL ? { uploadFileFromURL } : {}),
  };

  const plugin: IPlugin = {
    key: adapter.key,
    label: adapter.label,
    version: adapter.version,
    adapters: [adapter],
  };

  pluginRegistry.register(plugin);
  return plugin;
}
