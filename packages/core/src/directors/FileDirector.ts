import { BaseDirector } from '@unchainedshop/utils';
import type { IFileAdapter, UploadedFile } from '@unchainedshop/core-files';
import { FileAdapter } from '@unchainedshop/core-files';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export type UploadFileCallback<UnchainedAPI = unknown> = (
  file: UploadedFile,
  unchainedAPI: UnchainedAPI,
) => Promise<void>;

const FileUploadRegistry = new Map<string, UploadFileCallback>();

const baseDirector = BaseDirector<IFileAdapter>('FileDirector');

export const FileDirector = {
  ...baseDirector,

  // Override to query pluginRegistry dynamically
  getAdapter: (key: string) => {
    const adapters = pluginRegistry.getAdapters(FileAdapter.adapterType!) as IFileAdapter[];
    return adapters.find((adapter) => adapter.key === key) || null;
  },

  // Override to query pluginRegistry dynamically
  getAdapters: (options?: { adapterFilter?: (adapter: IFileAdapter) => boolean }) => {
    const { adapterFilter } = options || {};
    const adapters = pluginRegistry.getAdapters(FileAdapter.adapterType!) as IFileAdapter[];
    return adapters.filter(adapterFilter || (() => true));
  },

  registerFileUploadCallback<UnchainedAPI>(directoryName: string, fn: UploadFileCallback<UnchainedAPI>) {
    if (!FileUploadRegistry.has(directoryName)) {
      FileUploadRegistry.set(directoryName, fn);
    }
  },

  getFileUploadCallback(directoryName: string) {
    return FileUploadRegistry.get(directoryName) || null;
  },
};
