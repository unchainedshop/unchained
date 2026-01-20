import express from 'express';
import http from 'node:http';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/express';
import { registerAllPlugins } from '@unchainedshop/plugins/presets/all';
import { createLogger } from '@unchainedshop/logger';
import seed from './seed.ts';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenAI } from '@ai-sdk/openai';
import { HalfPriceManualPlugin } from '@unchainedshop/plugins/pricing/discount-half-price-manual';
import { HundredOffPlugin } from '@unchainedshop/plugins/pricing/discount-100-off';
import { pluginRegistry } from '@unchainedshop/core';

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
  // Register all plugins before starting platform
  registerAllPlugins();

  // Register additional discount plugins
  pluginRegistry.register(HalfPriceManualPlugin);
  pluginRegistry.register(HundredOffPlugin);

  const engine = await startPlatform({});

  connect(app, engine, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    adminUI: false,
    chat: provider ? {
      model: provider.chatModel(process.env.OPENAI_MODEL),
      imageGenerationTool: imageProvider ? { model: imageProvider.imageModel('gpt-image-1') } : undefined,
    } : undefined,
  });

  // Seed Database
  await seed(engine.unchainedAPI);

  // Warning: Do not use this in production - creates access token for bulk import API
  const result = await engine.unchainedAPI.modules.users.createAccessToken('admin');
  if (result) {
    logger.info(`Access token for admin: ${result.token}`);
  }

  await httpServer.listen({ port: process.env.PORT || 3000 });
  logger.info(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
} catch (error) {
  logger.error(error);
  process.exit(1);
}
