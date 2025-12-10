import type { UnchainedCore } from '@unchainedshop/core';
import express from 'express';

import handler from '../payment/cryptopay/handler-express.js';
import { configureExportToken } from '../worker/export-token.js';

const { CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay' } = process.env;

export default (app, unchainedAPI: UnchainedCore) => {
  app.use(CRYPTOPAY_WEBHOOK_PATH, express.json(), handler);
  configureExportToken(unchainedAPI);
};
