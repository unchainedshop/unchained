import Fastify from 'fastify';
import { anthropic } from '@ai-sdk/anthropic';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToFastify from '@unchainedshop/plugins/presets/all-fastify.js';
import { connectChat, fastifyRouter } from '@unchainedshop/admin-ui/fastify';
import seed from './seed.js';
import { openai } from '@ai-sdk/openai';
import { useErrorHandler } from '@envelop/core';
import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

const { ANTHROPIC_API_KEY, ROOT_URL } = process.env;

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

  if (ANTHROPIC_API_KEY) {
    fastify.log.info('Using ANTHROPIC_API_KEY, chat functionality will be available.');
    connectChat(fastify, {
      model: anthropic('claude-4-sonnet-20250514'),
      maxSteps: 1,
      imageGenerationTool: {
        model: openai.image('dall-e-3'),
      },
    });
  } else {
    fastify.log.info('No ANTHROPIC_API_KEY found, chat functionality will not be available.');
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
