import type { IPlugin } from '@unchainedshop/core';
import { tempUploadHandler } from './api.ts';

const { TEMP_UPLOAD_API_PATH = '/temp-upload' } = process.env;

// Plugin definition
// Note: This plugin has routes only, no adapter
export const TempUploadPlugin: IPlugin = {
  key: 'shop.unchained.files.temp-upload',
  label: 'Temp Upload Plugin',
  version: '1.0.0',

  routes: [
    {
      path: TEMP_UPLOAD_API_PATH,
      method: 'POST',
      handler: tempUploadHandler,
    },
  ],
};

export default TempUploadPlugin;
