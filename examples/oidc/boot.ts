import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import seed from './seed.js';
import Fastify from 'fastify';
import setupZitadel from './zitadel.js';
// import setupKeycloak from './keycloak.js';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: process.env.NODE_ENV !== 'production',
});

try {
  // It's very important to await this, else the fastify-session plugin will not work
  const context = await setupZitadel(fastify);

  const platform = await startPlatform({
    modules: baseModules,
    context,
    adminUiConfig: {
      singleSignOnURL: `${process.env.ROOT_URL}/login`,
    },
  });
  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  });
  connectBasePluginsToFastify(fastify);

  await seed(platform.unchainedAPI);

  // Warning: Do not use this in production
  await setAccessToken(platform.unchainedAPI, 'admin', 'secret');

  await fastify.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
