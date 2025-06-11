import Fastify from 'fastify';
import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import defaultModules from '@unchainedshop/plugins/presets/all.js';
import connectDefaultPluginsToFastify from '@unchainedshop/plugins/presets/all-fastify.js';
import seed from './seed.js';
import { fastifyRouter } from '@unchainedshop/admin-ui'

import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: process.env.NODE_ENV !== 'production',
});

try {
  const platform = await startPlatform({
    modules: defaultModules,
  });

  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  });
  connectDefaultPluginsToFastify(fastify, platform);

  fastify.register(fastifyRouter, {
    prefix: '/',
  });

  await seed(platform.unchainedAPI);
  await setAccessToken(platform.unchainedAPI, 'admin', 'secret');

  await fastify.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
