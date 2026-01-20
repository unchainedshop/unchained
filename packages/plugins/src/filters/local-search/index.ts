import { type IPlugin } from '@unchainedshop/core';
import { LocalSearch } from './adapter.ts';
import { isDocumentDBCompatModeEnabled } from '@unchainedshop/mongodb';

// Plugin definition
export const LocalSearchPlugin: IPlugin = {
  key: 'shop.unchained.filters.local-search',
  label: 'Local Search Filter Plugin',
  version: '1.0.0',

  adapters: [LocalSearch],

  onRegister: () => {
    // Check if DocumentDB compat mode is enabled
    if (isDocumentDBCompatModeEnabled()) {
      throw new Error(
        'Full-text search queries have been disabled due to DocumentDB compatibility mode (env UNCHAINED_DOCUMENTDB_COMPAT_MODE is trueish)',
      );
    }
  },
};

export default LocalSearchPlugin;

// Re-export adapter for direct use
export { LocalSearch } from './adapter.ts';
