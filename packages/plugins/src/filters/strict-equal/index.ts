import { type IPlugin } from '@unchainedshop/core';
import { StrictEqualFilter } from './adapter.ts';

// Plugin definition
export const StrictEqualFilterPlugin: IPlugin = {
  key: 'shop.unchained.filters.strict-equal',
  label: 'Strict Equal Filter Plugin',
  version: '1.0.0',

  adapters: [StrictEqualFilter],
};

export default StrictEqualFilterPlugin;
