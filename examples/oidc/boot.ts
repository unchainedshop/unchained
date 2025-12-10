import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import seed from './seed.ts';
import Fastify from 'fastify';
import setupZitadel from './zitadel.ts';
import setupKeycloak from './keycloak.ts';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  let context;
  if (process.env.UNCHAINED_ZITADEL_CLIENT_ID) {
    context = await setupZitadel(fastify);
  } else if (process.env.UNCHAINED_KEYCLOAK_CLIENT_ID) {
    context = await setupKeycloak(fastify);
  } else {
    throw new Error('Please set either UNCHAINED_ZITADEL_CLIENT_ID or UNCHAINED_KEYCLOAK_CLIENT_ID');
  }

  const platform = await startPlatform({
    modules: baseModules,
    context,
    options: {
      users: {
        validateEmail: async () => true,
      }
    },
    adminUiConfig: {
      singleSignOnURL: `${process.env.ROOT_URL}/login`,
    },
  });

  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    adminUI: true,
    initPluginMiddlewares: connectBasePluginsToFastify,
  });

  await seed(platform.unchainedAPI);

  // Warning: Do not use this in production
  await setAccessToken(platform.unchainedAPI, 'admin', 'secret');

  await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
