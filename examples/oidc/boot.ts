import { startPlatform, setAccessToken } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import seed from './seed.js';
import Fastify from 'fastify';
import setupZitadel from './zitadel.js';
import setupKeycloak from './keycloak.js';
import { anthropic } from '@ai-sdk/anthropic';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  // It's very important to await this, else the fastify-session plugin will not work

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
    adminUiConfig: {
      singleSignOnURL: `${process.env.ROOT_URL}/login`,
    },
    chatConfiguration,
    healthCheckEndpoint: null,
  });
  connect(fastify, platform, {
    chatConfiguration,
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
