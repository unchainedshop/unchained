import { type IPlugin } from '@unchainedshop/core';
import { StrictQualFilter } from './adapter.ts';

// Plugin definition
export const StrictQualFilterPlugin: IPlugin = {
  key: 'shop.unchained.filters.strict-qual',
  label: 'Strict Equal Filter Plugin',
  version: '1.0.0',

  adapters: [StrictQualFilter],
};

export default StrictQualFilterPlugin;

// Re-export adapter for direct use
export { StrictQualFilter } from './adapter.ts';
