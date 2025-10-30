import Fastify from 'fastify';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenAI } from '@ai-sdk/openai';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import {
  connect,
  unchainedLogger,
  connectChat,
  fastifyRouter,
} from '@unchainedshop/api/lib/fastify/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToFastify from '@unchainedshop/plugins/presets/all-fastify.js';
import seed from './seed.js';
import { useErrorHandler } from '@envelop/core';

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';
import { registerProductDiscoverabilityFilter } from '@unchainedshop/core';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  registerProductDiscoverabilityFilter({ hiddenTagValue: 'device' });

  const platform = await startPlatform({
    plugins: [
      useErrorHandler(({ errors }) => {
        for (const error of errors) {
          const { code: errorCode } = (error as any).extensions || {};
          if (!errorCode) continue;
          (error as any).path?.map((path) => {
            fastify.log.error(`${error.message} (${path} -> ${error.name})`);
          });
        }
      }),
    ],
    modules: defaultModules,
  });

  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  });

  connectDefaultPluginsToFastify(fastify, platform);

  // llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
  if (process.env.OPENAI_BASE_URL && process.env.OPENAI_MODEL) {
    const provider = createOpenAICompatible({
      name: 'local',
      baseURL: process.env.OPENAI_BASE_URL,
    });
    const imageProvider = process.env.OPENAI_API_KEY && createOpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    });

    connectChat(fastify, {
      model: provider.chatModel(process.env.OPENAI_MODEL),
      imageGenerationTool: imageProvider ? { model: imageProvider.imageModel('gpt-image-1') } : undefined,
    });
  }

  fastify.register(fastifyRouter, {
    prefix: '/',
  });

  await seed(platform.unchainedAPI);
  await setAccessToken(platform.unchainedAPI, 'admin', 'secret');

  await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
