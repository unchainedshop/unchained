import express from 'express';
import http from 'node:http';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/express';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import initPluginMiddlewares from '@unchainedshop/plugins/presets/all-express.js';
import { createLogger } from '@unchainedshop/logger';
import seed from './seed.js';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenAI } from '@ai-sdk/openai';
import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

const logger = createLogger('express');
const app = express();

// llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
const provider = process.env.OPENAI_BASE_URL && process.env.OPENAI_MODEL && createOpenAICompatible({
  name: 'local',
  baseURL: process.env.OPENAI_BASE_URL,
});

const imageProvider = process.env.OPENAI_API_KEY && createOpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

const httpServer = http.createServer(app);

try {
  const engine = await startPlatform({
    modules: defaultModules,
  });

  connect(app, engine, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    adminUI: false,
    chat: provider ? {
      model: provider.chatModel(process.env.OPENAI_MODEL),
      imageGenerationTool: imageProvider ? { model: imageProvider.imageModel('gpt-image-1') } : undefined,
    } : undefined,
    initPluginMiddlewares,
  });

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
