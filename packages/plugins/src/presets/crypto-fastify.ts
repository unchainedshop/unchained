import { UnchainedCore } from '@unchainedshop/core';

import { cryptopayHandler } from '../payment/cryptopay/middleware-fastify.js';
import { configureExportToken } from '../worker/export-token.js';

const { CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay' } = process.env;

export default (fastify, unchainedAPI: UnchainedCore) => {
  fastify.route({
    url: CRYPTOPAY_WEBHOOK_PATH,
    method: ['GET', 'PUT', 'OPTIONS'],
    handler: cryptopayHandler,
  });
  configureExportToken(unchainedAPI);
};
