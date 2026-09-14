import { startPlatform } from '@unchainedshop/platform';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import type { OIDCProviderConfig } from '@unchainedshop/api/lib/auth.js';
import seed from './seed.ts';
import Fastify from 'fastify';
import setupZitadel, { getZitadelOIDCConfig } from './zitadel.ts';
import setupKeycloak, { getKeycloakOIDCConfig } from './keycloak.ts';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  // Register base plugins before starting platform
  registerBasePlugins();

  let context;
  let oidcProviders: OIDCProviderConfig[] = [];

  if (process.env.UNCHAINED_ZITADEL_CLIENT_ID) {
    context = await setupZitadel(fastify);
    oidcProviders = [getZitadelOIDCConfig()];
  } else if (process.env.UNCHAINED_KEYCLOAK_CLIENT_ID) {
    context = await setupKeycloak(fastify);
    oidcProviders = [getKeycloakOIDCConfig()];
  } else {
    throw new Error('Please set either UNCHAINED_ZITADEL_CLIENT_ID or UNCHAINED_KEYCLOAK_CLIENT_ID');
  }

  const platform = await startPlatform({
    context,
    options: {
      users: {
        // This example bypasses email format validation for imported accounts.
        // A user ID prefix does not establish that the provider verified an email.
        validateEmail: async () => true,
      },
    },
    adminUiConfig: {
      singleSignOnURL: `${process.env.ROOT_URL}/login`,
    },
  });

  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    adminUI: true,
    // Pass OIDC providers for back-channel logout support
    authConfig: {
      oidcProviders,
    },
  });

  await seed(platform.unchainedAPI);

  // SECURITY: Only create and log admin token in non-production environments
  // In production, tokens should be managed through secure credential stores
  if (process.env.NODE_ENV !== 'production') {
    const result = await platform.unchainedAPI.modules.users.createAccessToken('admin');
    if (result) {
      fastify.log.warn(`DEV ONLY - Admin access token (do not use in production): ${result.token}`);
    }
  }

  await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
