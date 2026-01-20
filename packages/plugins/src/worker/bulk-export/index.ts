import { type IPlugin } from '@unchainedshop/core';
import { BulkExport } from './adapter.ts';

// Plugin definition
export const BulkExportPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.bulk-export',
  label: 'Bulk Export Worker Plugin',
  version: '1.0.0',

  adapters: [BulkExport],
};

export default BulkExportPlugin;

// Re-export adapter for direct use
export { BulkExport } from './adapter.ts';
