import { type IPlugin } from '@unchainedshop/core';
import { BulkGateWorker } from './adapter.ts';

// Plugin definition
export const BulkGatePlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.bulkgate',
  label: 'BulkGate SMS Worker Plugin',
  version: '1.0.0',

  adapters: [BulkGateWorker],
};

export default BulkGatePlugin;

// Re-export adapter for direct use
export { BulkGateWorker } from './adapter.ts';
