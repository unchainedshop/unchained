import express from 'express';
import { UnchainedCore } from '@unchainedshop/core';

import connectCryptoToExpress from './crypto-express.js';
import connectBaseToExpress from './base-express.js';

import { datatransHandler } from '../payment/datatrans-v2/handler-express.js';
import { stripeHandler } from '../payment/stripe/handler-express.js';
import { postfinanceCheckoutHandler } from '../payment/postfinance-checkout/handler-express.js';
import { appleIAPHandler } from '../payment/apple-iap/handler-express.js';
import { payrexxHandler } from '../payment/payrexx/handler-express.js';
import { saferpayHandler } from '../payment/saferpay/handler-express.js';
import { configureGenerateOrderAutoscheduling } from '../worker/enrollment-order-generator.js';

const {
  STRIPE_WEBHOOK_PATH = '/payment/stripe',
  PAYREXX_WEBHOOK_PATH = '/payment/payrexx',
  PFCHECKOUT_WEBHOOK_PATH = '/payment/postfinance-checkout',
  DATATRANS_WEBHOOK_PATH = '/payment/datatrans/webhook',
  APPLE_IAP_WEBHOOK_PATH = '/payment/apple-iap',
  SAFERPAY_WEBHOOK_PATH = '/payment/saferpay/webhook',
} = process.env;

export default (app: express.Express, { unchainedAPI }: { unchainedAPI: UnchainedCore }) => {
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
