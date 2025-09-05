import Fastify from 'fastify';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToFastify from '@unchainedshop/plugins/presets/all-fastify.js';
import { connectChat, fastifyRouter } from '@unchainedshop/admin-ui/fastify';
import seed from './seed.js';
import { useErrorHandler } from '@envelop/core';
import { openai } from '@ai-sdk/openai';

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  const platform = await startPlatform({
    plugins: [useErrorHandler(({ errors }) => {
      for (const error of errors) {
        const { code: errorCode } = (error as any).extensions || {};
        if (!errorCode) continue;
        (error as any).path?.map((path) => {
          fastify.log.error(
            `${error.message} (${path} -> ${error.name})`
          );
        });
      }
    })],
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
    connectChat(fastify, {
      model: provider.chatModel(process.env.OPENAI_MODEL),
      imageGenerationTool: process.env.OPENAI_API_KEY ? { model: openai.image('dall-e-3') } : undefined,
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
