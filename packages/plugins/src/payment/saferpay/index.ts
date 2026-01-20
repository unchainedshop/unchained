import type { IPlugin } from '@unchainedshop/core';
import { WordlineSaferpay } from './adapter.ts';
import saferpayModules from './module.ts';
import { saferpayWebhookHandler } from './webhook.ts';

const { SAFERPAY_WEBHOOK_PATH = '/payment/saferpay/webhook' } = process.env;

// Plugin definition
export const SaferpayPlugin: IPlugin = {
  key: 'shop.unchained.payment.saferpay',
  label: 'Wordline Saferpay Payment Plugin',
  version: '1.0.0',

  adapters: [WordlineSaferpay],

  module: ({ db }) => ({
    saferpayTransactions: saferpayModules.saferpayTransactions.configure({ db }),
  }),

  routes: [
    {
      path: SAFERPAY_WEBHOOK_PATH,
      method: 'GET',
      handler: saferpayWebhookHandler,
    },
  ],

  onRegister: () => {
    const { SAFERPAY_CUSTOMER_ID, SAFERPAY_TERMINAL_ID, SAFERPAY_API_USER, SAFERPAY_API_PASSWORD } =
      process.env;

    if (!SAFERPAY_CUSTOMER_ID || !SAFERPAY_TERMINAL_ID || !SAFERPAY_API_USER || !SAFERPAY_API_PASSWORD) {
      throw new Error('Saferpay environment variables not fully configured');
    }
  },
};

export default SaferpayPlugin;

// Re-export adapter for direct use
export { WordlineSaferpay } from './adapter.ts';

// Type exports
export { type SaferpayTransactionsModule } from './module.ts';
