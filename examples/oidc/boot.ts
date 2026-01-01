/**
 * OIDC Example Boot Script
 *
 * This example demonstrates integrating Unchained with OIDC providers using
 * JWT Federation - a stateless approach where external OIDC tokens are
 * verified directly via JWKS without server-side sessions.
 *
 * Environment variables:
 * - OIDC_PROVIDER_NAME: Name for the provider (e.g., 'keycloak', 'auth0', 'zitadel')
 * - OIDC_ISSUER_URL: OIDC issuer URL (e.g., 'https://keycloak.example.com/realms/myrealm')
 * - OIDC_AUDIENCE: Expected audience (client ID or API audience)
 * - OIDC_ROLES_PATH: JSON path to roles in token (e.g., 'resource_access.client-id.roles')
 *
 * Usage:
 * 1. Set up your OIDC provider (Keycloak, Auth0, Zitadel, etc.)
 * 2. Configure the environment variables above
 * 3. Run: npx tsx boot.ts
 * 4. Authenticate with your OIDC provider to get a JWT
 * 5. Send requests to Unchained with Authorization: Bearer <token>
 */

import { startPlatform } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect, unchainedLogger } from '@unchainedshop/api/lib/fastify/index.js';
import seed from './seed.ts';
import Fastify from 'fastify';

const {
  OIDC_PROVIDER_NAME = 'oidc',
  OIDC_ISSUER_URL,
  OIDC_AUDIENCE,
  OIDC_ROLES_PATH,
  PORT = '3000',
  ROOT_URL = 'http://localhost:3000',
} = process.env;

if (!OIDC_ISSUER_URL || !OIDC_AUDIENCE) {
  console.error(`
OIDC Configuration Required

Please set the following environment variables:
  OIDC_ISSUER_URL   - Your OIDC provider's issuer URL
  OIDC_AUDIENCE     - Expected audience (client ID)

Optional:
  OIDC_PROVIDER_NAME - Name for the provider (default: 'oidc')
  OIDC_ROLES_PATH    - Path to roles in token (e.g., 'resource_access.client-id.roles')

Example for Keycloak:
  OIDC_PROVIDER_NAME=keycloak
  OIDC_ISSUER_URL=https://keycloak.example.com/realms/myrealm
  OIDC_AUDIENCE=my-client-id
  OIDC_ROLES_PATH=resource_access.my-client-id.roles

Example for Auth0:
  OIDC_PROVIDER_NAME=auth0
  OIDC_ISSUER_URL=https://your-tenant.auth0.com/
  OIDC_AUDIENCE=your-api-audience

Example for Zitadel:
  OIDC_PROVIDER_NAME=zitadel
  OIDC_ISSUER_URL=https://your-instance.zitadel.cloud
  OIDC_AUDIENCE=your-project-id
  OIDC_ROLES_PATH=urn:zitadel:iam:org:project:roles
`);
  process.exit(1);
}

// Parse roles path from environment
const rolesPath = OIDC_ROLES_PATH?.split('.').filter(Boolean) || [];

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  // Start the platform
  const platform = await startPlatform({
    modules: baseModules,
    options: {
      users: {
        validateEmail: async () => true,
      },
    },
    adminUiConfig: {
      singleSignOnURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/auth?client_id=${OIDC_AUDIENCE}&response_type=code&scope=openid%20profile%20email&redirect_uri=${encodeURIComponent(ROOT_URL)}`,
    },
  });

  // Connect Fastify with OIDC provider configuration
  connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    adminUI: true,
    initPluginMiddlewares: connectBasePluginsToFastify,
    authConfig: {
      oidcProviders: [
        {
          name: OIDC_PROVIDER_NAME,
          issuer: OIDC_ISSUER_URL,
          audience: OIDC_AUDIENCE,
          rolesPath: rolesPath.length > 0 ? rolesPath : undefined,
        },
      ],
    },
  });

  await seed(platform.unchainedAPI);
  await fastify.listen({ host: '::', port: parseInt(PORT) });

  console.log(`
Unchained OIDC Server Running
=============================

Server:     http://localhost:${PORT}
GraphQL:    http://localhost:${PORT}/graphql
Admin UI:   http://localhost:${PORT}/

OIDC Configuration:
  Provider: ${OIDC_PROVIDER_NAME}
  Issuer:   ${OIDC_ISSUER_URL}
  Audience: ${OIDC_AUDIENCE}
  ${rolesPath.length > 0 ? `Roles path: ${OIDC_ROLES_PATH}` : ''}

To authenticate:
1. Get a JWT from your OIDC provider
2. Send requests with: Authorization: Bearer <token>
`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
