import type { IPlugin } from '@unchainedshop/core';
import { BulkImportWorker } from './adapter.ts';
import { bulkImportHandler } from './api.ts';

const { BULK_IMPORT_API_PATH = '/bulk-import' } = process.env;

// Plugin definition
export const BulkImportPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.bulk-import',
  label: 'Bulk Import Worker Plugin',
  version: '1.0.0',

  adapters: [BulkImportWorker],

  routes: [
    {
      path: BULK_IMPORT_API_PATH,
      method: 'POST',
      handler: bulkImportHandler,
    },
  ],
};

export default BulkImportPlugin;

// Re-export adapter for direct use
export { BulkImportWorker } from './adapter.ts';
