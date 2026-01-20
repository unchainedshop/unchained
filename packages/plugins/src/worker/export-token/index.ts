import { type IPlugin } from '@unchainedshop/core';
import { ExportTokenWorker, configureExportToken } from './adapter.ts';

// Plugin definition
export const ExportTokenPlugin: IPlugin = {
  key: 'shop.unchained.worker.export-token',
  label: 'Export Token Worker Plugin',
  version: '1.0.0',

  adapters: [ExportTokenWorker],

  onRegister: (unchainedAPI) => {
    configureExportToken(unchainedAPI);
  },
};

export default ExportTokenPlugin;

// Re-export adapter for direct use
export { ExportTokenWorker, configureExportToken } from './adapter.ts';
