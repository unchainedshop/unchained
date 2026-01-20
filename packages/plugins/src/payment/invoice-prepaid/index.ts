import { type IPlugin } from '@unchainedshop/core';
import { InvoicePrepaid } from './adapter.ts';

// Plugin definition
export const InvoicePrepaidPlugin: IPlugin = {
  key: 'shop.unchained.invoice-prepaid',
  label: 'Invoice Prepaid Payment Plugin',
  version: '1.0.0',

  adapters: [InvoicePrepaid],
};

export default InvoicePrepaidPlugin;

// Re-export adapter for direct use
export { InvoicePrepaid } from './adapter.ts';
