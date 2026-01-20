import type { IPlugin } from '@unchainedshop/core';
import { AppleIAP } from './adapter.ts';
import { configureAppleTransactionsModule, type AppleTransactionsModule } from './module.ts';
import { appleIAPWebhookHandler } from './api.ts';

const { APPLE_IAP_WEBHOOK_PATH = '/payment/apple-iap', APPLE_IAP_SHARED_SECRET } = process.env;

// Plugin definition
export const AppleIAPPlugin: IPlugin = {
  key: 'shop.unchained.payment.apple-iap',
  label: 'Apple In-App-Purchase Payment Plugin',
  version: '1.0.0',

  adapters: [AppleIAP],

  module: ({ db }) => ({
    appleTransactions: configureAppleTransactionsModule({ db }),
  }),

  routes: [
    {
      path: APPLE_IAP_WEBHOOK_PATH,
      method: 'POST',
      handler: appleIAPWebhookHandler,
    },
  ],

  onRegister: () => {
    if (!APPLE_IAP_SHARED_SECRET) {
      throw new Error('APPLE_IAP_SHARED_SECRET not set');
    }
  },
};

export default AppleIAPPlugin;

// Re-export adapter for direct use
export { AppleIAP } from './adapter.ts';

// Type exports
export { type AppleTransactionsModule };
