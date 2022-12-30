import { FilesSettings } from '@unchainedshop/types/files.js';

export const defaultTransformUrl = (url) => url;

export const filesSettings: FilesSettings = {
  transformUrl: null,
  configureSettings: async ({ transformUrl }) => {
    filesSettings.transformUrl = transformUrl || defaultTransformUrl;
  },
};
