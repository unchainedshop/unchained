import { type IPlugin } from '@unchainedshop/core';
import { HundredOff } from './adapter.ts';

// Plugin definition
export const HundredOffPlugin: IPlugin = {
  key: 'shop.unchained.discount.100-off',
  label: '100 Off Discount Plugin',
  version: '1.0.0',

  adapters: [HundredOff],
};

export default HundredOffPlugin;

// Re-export adapter for direct use
export { HundredOff } from './adapter.ts';
