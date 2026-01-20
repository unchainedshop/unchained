import { type IPlugin } from '@unchainedshop/core';
import { PickMup } from './adapter.ts';

// Plugin definition
export const PickMupPlugin: IPlugin = {
  key: 'shop.unchained.stores',
  label: 'Pick-up Stores Delivery Plugin',
  version: '1.0.0',

  adapters: [PickMup],
};

export default PickMupPlugin;

// Re-export adapter for direct use
export { PickMup } from './adapter.ts';
