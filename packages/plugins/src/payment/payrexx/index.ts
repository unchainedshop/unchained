import type { IPlugin } from '@unchainedshop/core';
import { Payrexx } from './adapter.ts';
import { payrexxWebhookHandler } from './api.ts';

const { PAYREXX_WEBHOOK_PATH = '/payment/payrexx' } = process.env;

// Plugin definition
export const PayrexxPlugin: IPlugin = {
  key: 'shop.unchained.payment.payrexx',
  label: 'Payrexx Payment Plugin',
  version: '1.0.0',

  adapters: [Payrexx],

  routes: [
    {
      path: PAYREXX_WEBHOOK_PATH,
      method: 'POST',
      handler: payrexxWebhookHandler,
    },
  ],

  onRegister: () => {
    if (!process.env.PAYREXX_SECRET) {
      throw new Error('PAYREXX_SECRET not set');
    }
  },
};

export default PayrexxPlugin;

// Re-export adapter for direct use
export { Payrexx } from './adapter.ts';
