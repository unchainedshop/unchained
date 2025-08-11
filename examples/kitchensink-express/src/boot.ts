import express from 'express';
import http from 'node:http';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
import { createLogger } from '@unchainedshop/logger';
import { expressRouter, connectChat } from '@unchainedshop/admin-ui/express';
import seed from './seed.js';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

const { ANTHROPIC_API_KEY } = process.env;

const logger = createLogger('express');
const app = express();

const httpServer = http.createServer(app);

try {
  const engine = await startPlatform({
    modules: defaultModules,
  });

  connect(app, engine, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  });

  connectDefaultPluginsToExpress(app, engine);

  if (ANTHROPIC_API_KEY) {
    logger.info('Using ANTHROPIC_API_KEY, chat functionality will be available.');
    connectChat(app, {
      system:
        'do not include the data in your summary, just write a summary about it in one short paragraph and never list all the fields of a result, just summarize paragraph about your findings, if necessary. additionally all price are integer type and if you can not determine the currency decimal point you should refer to in currencies.',
      model: anthropic('claude-4-sonnet-20250514'),
      maxSteps: 1,
      imageGenerationTool: {
        model: openai.image('dall-e-3'),
      },
    });
  } else {
    logger.info('No ANTHROPIC_API_KEY found, chat functionality will not be available.');
  }

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
