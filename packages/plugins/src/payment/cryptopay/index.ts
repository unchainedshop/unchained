import type { IPlugin } from '@unchainedshop/core';
import cryptopayModules from './module.ts';
import { Cryptopay } from './adapter.ts';
import { cryptopayWebhookHandler } from './api.ts';

const {
  CRYPTOPAY_SECRET,
  CRYPTOPAY_BTC_XPUB,
  CRYPTOPAY_ETH_XPUB,
  CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay',
} = process.env;

// Plugin definition
export const CryptopayPlugin: IPlugin = {
  key: 'shop.unchained.payment.cryptopay',
  label: 'Cryptopay Payment Plugin',
  version: '1.0.0',

  adapters: [Cryptopay],

  module: ({ db }) => ({
    cryptopay: cryptopayModules.cryptopay.configure({ db }),
  }),

  routes: [
    {
      path: CRYPTOPAY_WEBHOOK_PATH,
      method: 'POST',
      handler: cryptopayWebhookHandler,
    },
  ],

  onRegister: () => {
    if (!CRYPTOPAY_SECRET) {
      throw new Error('CRYPTOPAY_SECRET not set');
    }
    if (!CRYPTOPAY_BTC_XPUB && !CRYPTOPAY_ETH_XPUB) {
      throw new Error('No CRYPTOPAY_BTC_XPUB or CRYPTOPAY_ETH_XPUB set');
    }
  },
};

export default CryptopayPlugin;

// Re-export adapter for direct use
export { Cryptopay } from './adapter.ts';

// Type exports
export { type CryptopayModule } from './module.ts';
