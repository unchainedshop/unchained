import { type IPlugin } from '@unchainedshop/core';
import { Download } from './adapter.ts';

// Plugin definition
export const DownloadPlugin: IPlugin = {
  key: 'shop.unchained.delivery.download',
  label: 'Download Delivery Plugin',
  version: '1.0.0',

  adapters: [Download],
};

export default DownloadPlugin;

// Re-export adapter for direct use
export { Download } from './adapter.ts';
