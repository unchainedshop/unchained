import { ModuleInput, UnchainedCore } from '@unchainedshop/core';
import express from 'express';

import baseModules from './presets/base-modules.js';
import './presets/countries/ch.js';
import cryptoModules from './presets/crypto-modules.js';

import connectCryptoToExpress from './presets/crypto-express.js';
import connectBaseToExpress from './presets/base-express.js';

// Delivery
import './delivery/send-message.js';
import './delivery/stores.js';

// Payment
import './payment/invoice-prepaid.js';
import './payment/paypal-checkout.js';
import { datatransHandler } from './payment/datatrans-v2/index.js';
import { appleIAPHandler, configureAppleTransactionsModule } from './payment/apple-iap/index.js';
import { stripeHandler } from './payment/stripe/index.js';
import { postfinanceCheckoutHandler } from './payment/postfinance-checkout/index.js';
import { configureSaferpayTransactionsModule, saferpayHandler } from './payment/saferpay/index.js';
import { payrexxHandler } from './payment/payrexx/index.js';

// Filter & Search
import './filters/strict-equal.js';
import './filters/local-search.js';

// Workers
import './worker/sms.js';
import './worker/push-notification.js';
import { configureGenerateOrderAutoscheduling } from './worker/enrollment-order-generator.js';

const {
  STRIPE_WEBHOOK_PATH = '/payment/stripe',
  PAYREXX_WEBHOOK_PATH = '/payment/payrexx',
  PFCHECKOUT_WEBHOOK_PATH = '/payment/postfinance-checkout',
  DATATRANS_WEBHOOK_PATH = '/payment/datatrans/webhook',
  APPLE_IAP_WEBHOOK_PATH = '/payment/apple-iap',
  SAFERPAY_WEBHOOK_PATH = '/payment/saferpay/webhook',
} = process.env;

export const defaultModules: Record<
  string,
  {
    configure: (params: ModuleInput<any>) => any;
  }
> = {
  ...baseModules,
  ...cryptoModules,
  appleTransactions: {
    configure: configureAppleTransactionsModule,
  },
  saferpayTransactions: {
    configure: configureSaferpayTransactionsModule,
  },
};

export const connectDefaultPluginsToExpress4 = (
  app,
  { unchainedAPI }: { unchainedAPI: UnchainedCore },
) => {
  connectBaseToExpress(app);
  connectCryptoToExpress(app, unchainedAPI);

  app.use(STRIPE_WEBHOOK_PATH, express.raw({ type: 'application/json' }), stripeHandler);
  app.use(PFCHECKOUT_WEBHOOK_PATH, express.json(), postfinanceCheckoutHandler);

  app.use(
    DATATRANS_WEBHOOK_PATH,
    express.text({
      type: 'application/json',
    }),
    datatransHandler,
  );

  app.use(
    APPLE_IAP_WEBHOOK_PATH,
    express.json({
      strict: false,
    }),
    appleIAPHandler,
  );

  app.use(PAYREXX_WEBHOOK_PATH, express.json({ type: 'application/json' }), payrexxHandler);
  app.use(SAFERPAY_WEBHOOK_PATH, saferpayHandler);

  configureGenerateOrderAutoscheduling();
};
