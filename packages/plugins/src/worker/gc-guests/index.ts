import { type IPlugin } from '@unchainedshop/core';
import { GCGuestsWorker, configureGCGuestsAutoscheduling } from './adapter.ts';

// Plugin definition
export const GCGuestsPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.gc-guests',
  label: 'Garbage Collect Guests Worker Plugin',
  version: '1.0.0',

  adapters: [GCGuestsWorker],

  onRegister: () => {
    configureGCGuestsAutoscheduling();
  },
};

export default GCGuestsPlugin;

// Re-export adapter for direct use
export * from './adapter.ts';
