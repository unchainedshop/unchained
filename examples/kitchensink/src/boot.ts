import Fastify from 'fastify';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToFastify from '@unchainedshop/plugins/presets/all-fastify.js';
import seed from './seed.js';
import { fastifyRouter } from '@unchainedshop/admin-ui';
import { anthropic } from '@ai-sdk/anthropic';

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  let chatConfiguration = null;

  if (process.env.ANTHROPIC_API_KEY) {
    chatConfiguration = {
      system:
        'do not include the data in your summary, just write a summary about it in one short paragraph and never list all the fields of a result, just summarize paragraph about your findings, if necessary',
      model: anthropic('claude-4-sonnet-20250514'),
      maxTokens: 8000,
      maxSteps: 1,
    };
  }

  const platform = await startPlatform({
    modules: defaultModules,
    chatConfiguration,
  });

  // fastify.register(fastifyRouter, {
  //   prefix: '/',
  // });

  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    chatConfiguration,
  });

  connectDefaultPluginsToFastify(fastify, platform);

  await seed(platform.unchainedAPI);
  await setAccessToken(platform.unchainedAPI, 'admin', 'secret');

  await fastify.listen({ host: '0.0.0.0', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
