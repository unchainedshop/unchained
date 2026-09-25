import type { IPlugin } from '@unchainedshop/core';
import { WorldlineSaferpay } from './adapter.ts';
import { configureSaferpayTransactionsModule } from './module.ts';
import { saferpayWebhookHandler } from './webhook.ts';

const { SAFERPAY_WEBHOOK_PATH = '/payment/saferpay/webhook' } = process.env;

// Plugin definition
export const SaferpayPlugin: IPlugin = {
  key: 'shop.unchained.payment.saferpay',
  label: 'Worldline Saferpay Payment Plugin',
  version: '1.0.0',

  adapters: [WorldlineSaferpay],

  module: ({ db }) => ({
    saferpayTransactions: configureSaferpayTransactionsModule({ db }),
  }),

  routes: [
    {
      path: SAFERPAY_WEBHOOK_PATH,
      method: 'GET',
      handler: saferpayWebhookHandler,
    },
  ],

  onRegister: () => {
    const {
      SAFERPAY_CUSTOMER_ID,
      SAFERPAY_TERMINAL_ID,
      SAFERPAY_API_USER,
      SAFERPAY_API_PASSWORD,
      // Deprecated v4.8 names, kept as fallback so existing configurations keep working
      SAFERPAY_USER,
      SAFERPAY_PW,
    } = process.env;

    if (
      !SAFERPAY_CUSTOMER_ID ||
      !SAFERPAY_TERMINAL_ID ||
      !(SAFERPAY_API_USER || SAFERPAY_USER) ||
      !(SAFERPAY_API_PASSWORD || SAFERPAY_PW)
    ) {
      throw new Error('Saferpay environment variables not fully configured');
    }
  },
};

export default SaferpayPlugin;

// Type exports
export { type SaferpayTransactionsModule } from './module.ts';
