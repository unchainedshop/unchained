import { UnchainedCore } from '@unchainedshop/core';
import { FastifyInstance } from 'fastify';

import connectCryptoToFastify from './crypto-fastify.js';
import connectBaseToFastify from './base-fastify.js';

import { stripeHandler } from '../payment/stripe/handler-fastify.js';
import { postfinanceCheckoutHandler } from '../payment/postfinance-checkout/handler-fastify.js';
import { datatransHandler } from '../payment/datatrans-v2/handler-fastify.js';
import { appleIAPHandler } from '../payment/apple-iap/handler-fastify.js';
import { payrexxHandler } from '../payment/payrexx/handler-fastify.js';
import { saferpayHandler } from '../payment/saferpay/handler-fastify.js';
import { configureGenerateOrderAutoscheduling } from '../worker/enrollment-order-generator.js';

const {
  STRIPE_WEBHOOK_PATH = '/payment/stripe',
  PAYREXX_WEBHOOK_PATH = '/payment/payrexx',
  PFCHECKOUT_WEBHOOK_PATH = '/payment/postfinance-checkout',
  DATATRANS_WEBHOOK_PATH = '/payment/datatrans/webhook',
  APPLE_IAP_WEBHOOK_PATH = '/payment/apple-iap',
  SAFERPAY_WEBHOOK_PATH = '/payment/saferpay/webhook',
} = process.env;

export default (fastify: FastifyInstance, { unchainedAPI }: { unchainedAPI: UnchainedCore }) => {
  connectBaseToFastify(fastify);
  connectCryptoToFastify(fastify, unchainedAPI);

  fastify.route({
    url: STRIPE_WEBHOOK_PATH,
    method: 'POST',
    handler: stripeHandler,
  });

  fastify.route({
    url: PFCHECKOUT_WEBHOOK_PATH,
    method: 'POST',
    handler: postfinanceCheckoutHandler,
  });

  fastify.route({
    url: DATATRANS_WEBHOOK_PATH,
    method: 'POST',
    handler: datatransHandler,
  });

  fastify.route({
    url: APPLE_IAP_WEBHOOK_PATH,
    method: 'POST',
    handler: appleIAPHandler,
  });

  fastify.route({
    url: PAYREXX_WEBHOOK_PATH,
    method: 'POST',
    handler: payrexxHandler,
  });

  fastify.route({
    url: SAFERPAY_WEBHOOK_PATH,
    method: 'GET',
    handler: saferpayHandler,
  });

  // app.use(STRIPE_WEBHOOK_PATH, express.raw({ type: 'application/json' }), stripeHandler);
  // app.use(PFCHECKOUT_WEBHOOK_PATH, express.json(), postfinanceCheckoutHandler);

  // app.use(
  //   DATATRANS_WEBHOOK_PATH,
  //   express.text({
  //     type: 'application/json',
  //   }),
  //   datatransHandler,
  // );

  // app.use(
  //   APPLE_IAP_WEBHOOK_PATH,
  //   express.json({
  //     strict: false,
  //   }),
  //   appleIAPHandler,
  // );

  // app.use(PAYREXX_WEBHOOK_PATH, express.json({ type: 'application/json' }), payrexxHandler);
  // app.use(SAFERPAY_WEBHOOK_PATH, saferpayHandler);

  configureGenerateOrderAutoscheduling();
};
