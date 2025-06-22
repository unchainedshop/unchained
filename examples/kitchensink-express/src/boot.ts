import express from 'express';
import http from 'node:http';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
import { createLogger } from '@unchainedshop/logger';
import { expressRouter } from '@unchainedshop/admin-ui';
import seed from './seed.js';
import cors from 'cors';
import { anthropic } from '@ai-sdk/anthropic';

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

const logger = createLogger('express');
const app = express();
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);

const httpServer = http.createServer(app);
app.use(express.json());

try {
  const engine = await startPlatform({
    modules: defaultModules,
    chatConfiguration: {
      system:
        'do not include the data in your summary, just write a summary about it never list all the fields of a result, just summarize paragraph about your findings, if necessary',
      model: anthropic('claude-4-sonnet-20250514'),

      maxTokens: 1000,
      maxSteps: 3,
    }
  });


  connect(app, engine, { allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production' });
  connectDefaultPluginsToExpress(app, engine);
  app.use('/', expressRouter);

  // Seed Database and Set a super insecure Access Token for admin
  await seed(engine.unchainedAPI);

  // Warning: Do not use this in production
  await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

  await httpServer.listen({ port: process.env.PORT || 3000 });
  logger.info(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
} catch (error) {
  logger.error(error);
  process.exit(1);
}
