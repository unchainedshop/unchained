import { type IPlugin } from '@unchainedshop/core';
import { Store } from './adapter.ts';

// Plugin definition
export const StorePlugin: IPlugin = {
  key: 'shop.unchained.warehousing.store',
  label: 'Store Warehousing Plugin',
  version: '1.0.0',

  adapters: [Store],
};

export default StorePlugin;

// Re-export adapter for direct use
export { Store } from './adapter.ts';
