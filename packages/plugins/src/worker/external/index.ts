import { type IPlugin } from '@unchainedshop/core';
import { ExternalWorkerPlugin as ExternalWorker } from './adapter.ts';

// Plugin definition
export const ExternalPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.external',
  label: 'External Worker Plugin',
  version: '1.0.0',

  adapters: [ExternalWorker],
};

export default ExternalPlugin;

// Re-export adapter for direct use
export { ExternalWorkerPlugin } from './adapter.ts';
