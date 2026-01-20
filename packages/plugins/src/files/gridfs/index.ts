import type { IPlugin } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import { GridFSAdapter } from './adapter.ts';
import { configureGridFSFileUploadModule } from './module.ts';
import { gridfsRouteHandler } from './api.ts';

const { GRIDFS_PUT_SERVER_PATH = '/gridfs', UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET } = process.env;

const logger = createLogger('unchained:gridfs');

// Plugin definition
export const GridFSPlugin: IPlugin = {
  key: 'shop.unchained.file-upload-plugin.gridfs',
  label: 'GridFS File Upload Plugin',
  version: '1.0.0',

  adapters: [GridFSAdapter],

  module: ({ db }) => ({
    gridfsFileUploads: configureGridFSFileUploadModule({ db }),
  }),

  routes: [
    {
      path: `${GRIDFS_PUT_SERVER_PATH}/:directoryName/:fileName`,
      method: 'ALL',
      handler: gridfsRouteHandler,
    },
  ],

  onRegister: () => {
    if (!UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET) {
      logger.warn(
        'UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET not set - PUT uploads and signed downloads will fail',
      );
    }
  },
};

export default GridFSPlugin;

// Re-export adapter for direct use
export { GridFSAdapter } from './adapter.ts';

// Type exports
export { type GridFSFileUploadsModule } from './module.ts';
