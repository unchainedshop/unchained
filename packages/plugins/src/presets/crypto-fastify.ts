import type { UnchainedCore } from '@unchainedshop/core';

import handler from '../payment/cryptopay/handler-fastify.js';
import { configureExportToken } from '../worker/export-token.js';

const { CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay' } = process.env;

export default (fastify, unchainedAPI: UnchainedCore) => {
  fastify.route({
    url: CRYPTOPAY_WEBHOOK_PATH,
    method: 'POST',
    handler,
  });
  configureExportToken(unchainedAPI);
};
