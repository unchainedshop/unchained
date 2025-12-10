import type { UnchainedCore } from '@unchainedshop/core';

import handler from '../payment/cryptopay/handler-fastify.ts';
import { configureExportToken } from '../worker/export-token.ts';

const { CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay' } = process.env;

export default (fastify, unchainedAPI: UnchainedCore) => {
  fastify.route({
    url: CRYPTOPAY_WEBHOOK_PATH,
    method: 'POST',
    handler,
  });
  configureExportToken(unchainedAPI);
};
