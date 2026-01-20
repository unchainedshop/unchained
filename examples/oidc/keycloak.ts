import type { UnchainedContextResolver } from '@unchainedshop/api';
import type { OIDCProviderConfig } from '@unchainedshop/api/lib/auth.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import FastifyOAuth2 from '@fastify/oauth2';
import * as jose from 'jose';
import { randomBytes } from 'node:crypto';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:oidc:keycloak');

const NONCE_COOKIE_NAME = 'oidc_nonce';

const {
  UNCHAINED_KEYCLOAK_CALLBACK_PATH = '/login/keycloak/callback',
  UNCHAINED_KEYCLOAK_CLIENT_ID,
  UNCHAINED_KEYCLOAK_CLIENT_SECRET,
  UNCHAINED_KEYCLOAK_REALM_URL,
  MCP_API_PATH = '/mcp',
  ROOT_URL = 'http://localhost:4010',
} = process.env;

interface KeycloakIdToken {
  sub: string;
  nonce?: string;
  resource_access?: Record<string, { roles: string[] }>;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
}

/**
 * Returns the OIDC provider configuration for Keycloak
 * This is used by the platform's JWT auth to verify back-channel logout tokens
 */
export function getKeycloakOIDCConfig(): OIDCProviderConfig {
  return {
    issuer: UNCHAINED_KEYCLOAK_REALM_URL!,
    audience: UNCHAINED_KEYCLOAK_CLIENT_ID,
    jwksUri: `${UNCHAINED_KEYCLOAK_REALM_URL}/protocol/openid-connect/certs`,
  };
}

/**
 * Setup Keycloak OAuth2 integration
 *
 * This simplified implementation:
 * 1. Uses @fastify/oauth2 for the authorization code flow
 * 2. After successful callback, issues a local JWT via context.login()
 * 3. Subsequent requests are authenticated via the platform's JWT system
 * 4. Back-channel logout is handled by the platform's unified handler
 */
export default async function setupKeycloak(app: FastifyInstance) {
  if (!UNCHAINED_KEYCLOAK_REALM_URL || !UNCHAINED_KEYCLOAK_CLIENT_ID)
    throw new Error(
      'Environment variables UNCHAINED_KEYCLOAK_CLIENT_ID and UNCHAINED_KEYCLOAK_REALM_URL are required',
    );

  // Fetch OIDC discovery document for logout URL
  const discoveryResponse = await fetch(
    `${UNCHAINED_KEYCLOAK_REALM_URL}/.well-known/openid-configuration`,
  );
  const discoveryData = (await discoveryResponse.json()) as {
    end_session_endpoint: string;
    jwks_uri: string;
  };

  // Create remote JWKS for token verification (jose handles caching and key rotation)
  const JWKS = jose.createRemoteJWKSet(new URL(discoveryData.jwks_uri));

  // Register OAuth2 plugin
  // Note: @fastify/oauth2 handles state parameter automatically for CSRF protection
  // We add nonce validation separately for OIDC replay attack protection
  app.register(FastifyOAuth2, {
    name: 'keycloak',
    credentials: {
      client: {
        id: UNCHAINED_KEYCLOAK_CLIENT_ID,
        secret: UNCHAINED_KEYCLOAK_CLIENT_SECRET,
      },
    },
    // Don't use startRedirectPath - we create a custom login route for nonce handling
    scope: ['profile', 'email', 'openid'],
    callbackUri: `${ROOT_URL}${UNCHAINED_KEYCLOAK_CALLBACK_PATH}`,
    discovery: { issuer: UNCHAINED_KEYCLOAK_REALM_URL },
  });

  // Custom login route with nonce generation
  app.get('/login', async function (
    this: FastifyInstance & { keycloak: FastifyOAuth2.OAuth2Namespace },
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    // Generate cryptographically secure nonce for replay attack protection
    const nonce = randomBytes(32).toString('base64url');

    // Store nonce in a secure, short-lived cookie
    reply.setCookie(NONCE_COOKIE_NAME, nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300, // 5 minutes - should be enough for auth flow
    });

    // Generate authorization URI and add nonce parameter
    const baseUri = await this.keycloak.generateAuthorizationUri(request, reply);
    const authUri = new URL(baseUri);
    authUri.searchParams.set('nonce', nonce);

    return reply.redirect(authUri.toString());
  });

  // Helper function to verify ID token signature and nonce using JWKS
  const verifyIdToken = async (idToken: string, expectedNonce: string): Promise<KeycloakIdToken> => {
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: UNCHAINED_KEYCLOAK_REALM_URL,
      audience: UNCHAINED_KEYCLOAK_CLIENT_ID,
    });

    // SECURITY: Validate nonce to prevent replay attacks
    if (payload.nonce !== expectedNonce) {
      throw new Error('ID token nonce mismatch - possible replay attack');
    }

    return payload as KeycloakIdToken;
  };

  // OAuth2 callback - creates/updates user and issues local JWT
  app.get(
    UNCHAINED_KEYCLOAK_CALLBACK_PATH,
    async function (
      this: FastifyInstance & { keycloak: FastifyOAuth2.OAuth2Namespace },
      request: FastifyRequest & { unchainedContext: any; cookies: Record<string, string> },
      reply,
    ) {
      try {
        // Retrieve and clear nonce cookie
        const expectedNonce = request.cookies[NONCE_COOKIE_NAME];
        reply.clearCookie(NONCE_COOKIE_NAME, { path: '/' });

        if (!expectedNonce) {
          throw new Error('Missing nonce cookie - possible session tampering');
        }

        const accessToken = await this.keycloak.getAccessTokenFromAuthorizationCodeFlow(request);
        // SECURITY: Verify ID token signature and nonce
        const decoded = await verifyIdToken(accessToken.token.id_token, expectedNonce);

        const {
          sub,
          resource_access,
          preferred_username,
          name,
          given_name,
          family_name,
          email,
          email_verified,
        } = decoded;

        const roles = resource_access?.[UNCHAINED_KEYCLOAK_CLIENT_ID!]?.roles || [];
        const userId = `${UNCHAINED_KEYCLOAK_CLIENT_ID}:${sub}`;

        const { modules } = request.unchainedContext;
        let user = await modules.users.findUserById(userId);

        if (!user) {
          // Check if username is available
          const userByUsername =
            preferred_username && (await modules.users.findUserByUsername(preferred_username));
          const usernameAvailable = preferred_username && (!userByUsername || userByUsername._id === userId);

          // Create new user
          user = await modules.users.createUser(
            {
              _id: userId,
              username: usernameAvailable ? preferred_username : sub,
              password: null,
              email: email_verified ? email : null,
              profile: {
                displayName: name,
                address: {
                  firstName: given_name,
                  lastName: family_name,
                },
              },
              roles,
            } as any,
            { skipMessaging: true, skipPasswordEnrollment: true },
          );
        } else {
          // Update roles if changed
          if (roles.join(':') !== (user.roles || []).join(':')) {
            user = await modules.users.updateRoles(user._id, roles);
          }
        }

        // Issue local JWT - the platform handles cookie setting
        await request.unchainedContext.login(user);

        return reply.redirect('/');
      } catch (e) {
        // SECURITY: Log full error server-side but return generic message to client
        logger.error('Keycloak callback error:', {
          message: (e as Error).message,
          name: (e as Error).name,
        });
        reply.status(500);
        return reply.send({
          success: false,
          message: 'Authentication failed. Please try again.',
        });
      }
    },
  );

  // Logout route - redirects to Keycloak end session endpoint
  app.route({
    url: '/logout',
    method: ['GET'],
    handler: async (req: FastifyRequest & { unchainedContext: any }, reply) => {
      // Clear local JWT
      await req.unchainedContext?.logout?.();

      // Redirect to Keycloak logout
      const logoutUrl = new URL(discoveryData.end_session_endpoint);
      logoutUrl.searchParams.set('post_logout_redirect_uri', ROOT_URL!);
      logoutUrl.searchParams.set('client_id', UNCHAINED_KEYCLOAK_CLIENT_ID!);
      return reply.redirect(logoutUrl.toString());
    },
  });

  // OAuth Protected Resource metadata for MCP
  app.route({
    url: '/.well-known/oauth-protected-resource',
    method: ['GET'],
    handler: (req, reply) => {
      return reply.send({
        resource: ROOT_URL,
        authorization_servers: [UNCHAINED_KEYCLOAK_REALM_URL],
        resource_documentation: 'https://docs.unchained.shop',
      });
    },
  });

  // MCP token verification hook
  app.addHook('onRequest', async (req) => {
    if (req.url === MCP_API_PATH) {
      try {
        const encodedToken = req.headers.authorization?.replace('Bearer ', '');
        if (encodedToken) {
          const { payload, protectedHeader } = await jose.jwtVerify(encodedToken, JWKS);
          (req as any).mcp = { payload, header: protectedHeader };
        }
      } catch {
        // Ignore invalid tokens
      }
    }
  });

  // Context wrapper for MCP authentication
  return (contextResolver: UnchainedContextResolver) => async (props: any, req: any) => {
    const context = await contextResolver(props);

    // If already authenticated via JWT, return as-is
    if (context.user) return context;

    // MCP token authentication
    if (req.mcp) {
      const roles = req.mcp.payload?.resource_access?.[UNCHAINED_KEYCLOAK_CLIENT_ID!]?.roles || [];
      return {
        ...context,
        user: { roles },
      };
    }

    return context;
  };
}
