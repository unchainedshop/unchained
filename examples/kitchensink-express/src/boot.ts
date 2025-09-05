import express from 'express';
import http from 'node:http';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/lib/express/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToExpress from '@unchainedshop/plugins/presets/all-express.js';
import { createLogger } from '@unchainedshop/logger';
import { expressRouter, connectChat } from '@unchainedshop/admin-ui/express';
import seed from './seed.js';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { openai } from '@ai-sdk/openai';
import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

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

  // llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
  if (process.env.OPENAI_BASE_URL && process.env.OPENAI_MODEL) {
    const provider = createOpenAICompatible({
      name: 'local',
      baseURL: process.env.OPENAI_BASE_URL,
    });
    connectChat(app, {
      model: provider.chatModel(process.env.OPENAI_MODEL),
      imageGenerationTool: process.env.OPENAI_API_KEY ? { model: openai.image('dall-e-3') } : undefined,
    });
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
