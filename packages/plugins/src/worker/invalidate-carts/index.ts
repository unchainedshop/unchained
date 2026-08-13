import { type IPlugin } from '@unchainedshop/core';
import { InvalidateCartsWorker, configureInvalidateCartsAutoscheduling } from './adapter.ts';

// Plugin definition
export const InvalidateCartsPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.invalidate-carts',
  label: 'Invalidate Carts Worker Plugin',
  version: '1.0.0',

  adapters: [InvalidateCartsWorker],

  onRegister: () => {
    configureInvalidateCartsAutoscheduling();
  },
};

export default InvalidateCartsPlugin;

// Re-export adapter for direct use
export * from './adapter.ts';
