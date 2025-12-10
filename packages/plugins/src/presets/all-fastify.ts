import type { UnchainedCore } from '@unchainedshop/core';
import type { FastifyInstance } from 'fastify';

import connectCryptoToFastify from './crypto-fastify.ts';
import connectBaseToFastify from './base-fastify.ts';

import { stripeHandler } from '../payment/stripe/handler-fastify.ts';
import { postfinanceCheckoutHandler } from '../payment/postfinance-checkout/handler-fastify.ts';
import { datatransHandler } from '../payment/datatrans-v2/handler-fastify.ts';
import { appleIAPHandler } from '../payment/apple-iap/handler-fastify.ts';
import { payrexxHandler } from '../payment/payrexx/handler-fastify.ts';
import { saferpayHandler } from '../payment/saferpay/handler-fastify.ts';
import { configureGenerateOrderAutoscheduling } from '../worker/enrollment-order-generator.ts';

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

  fastify.register((s, opts, registered) => {
    s.addContentTypeParser(
      'application/json',
      { parseAs: 'string', bodyLimit: 1024 * 1024 },
      s.defaultTextParser,
    );
    s.route({
      url: STRIPE_WEBHOOK_PATH,
      method: 'POST',
      handler: stripeHandler,
    });
    s.route({
      url: DATATRANS_WEBHOOK_PATH,
      method: 'POST',
      handler: datatransHandler,
    });
    registered();
  });

  fastify.route({
    url: PFCHECKOUT_WEBHOOK_PATH,
    method: 'POST',
    handler: postfinanceCheckoutHandler,
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

  configureGenerateOrderAutoscheduling();
};
