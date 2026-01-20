import type { IPlugin } from '@unchainedshop/core';
import { Datatrans } from './adapter.ts';
import { datatransWebhookHandler } from './api.ts';

const { DATATRANS_WEBHOOK_PATH = '/payment/datatrans/webhook' } = process.env;
const { DATATRANS_SIGN_KEY, DATATRANS_SIGN2_KEY } = process.env;

// Plugin definition
export const DatatransPlugin: IPlugin = {
  key: 'shop.unchained.datatrans',
  label: 'Datatrans Payment Plugin',
  version: '2.0.0',

  adapters: [Datatrans],

  routes: [
    {
      path: DATATRANS_WEBHOOK_PATH,
      method: 'POST',
      handler: datatransWebhookHandler,
    },
  ],

  onRegister: () => {
    if (!DATATRANS_SIGN_KEY && !DATATRANS_SIGN2_KEY) {
      throw new Error('DATATRANS_SIGN_KEY not set');
    }
  },
};

export default DatatransPlugin;

// Re-export adapter for direct use
export { Datatrans } from './adapter.ts';
