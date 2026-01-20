import { type IPlugin } from '@unchainedshop/core';
import { Invoice } from './adapter.ts';

// Plugin definition
export const InvoicePlugin: IPlugin = {
  key: 'shop.unchained.invoice',
  label: 'Invoice Payment Plugin',
  version: '1.0.0',

  adapters: [Invoice],
};

export default InvoicePlugin;

// Re-export adapter for direct use
export { Invoice } from './adapter.ts';
