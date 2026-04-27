import { type IPlugin } from '@unchainedshop/core';
import { LocalSearch } from './adapter.ts';

// Plugin definition
export const LocalSearchPlugin: IPlugin = {
  key: 'shop.unchained.filters.local-search',
  label: 'Local Search Filter Plugin',
  version: '1.0.0',

  adapters: [LocalSearch],
};

export default LocalSearchPlugin;

// Re-export adapter for direct use
export { LocalSearch } from './adapter.ts';
