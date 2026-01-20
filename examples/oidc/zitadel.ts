import type { UnchainedContextResolver } from '@unchainedshop/api';
import type { OIDCProviderConfig } from '@unchainedshop/api/lib/auth.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import FastifyOAuth2 from '@fastify/oauth2';
import * as jose from 'jose';
import { randomBytes } from 'node:crypto';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:oidc:zitadel');

const NONCE_COOKIE_NAME = 'oidc_nonce';

const {
  UNCHAINED_ZITADEL_CALLBACK_PATH = '/login/zitadel/callback',
  UNCHAINED_ZITADEL_CLIENT_ID,
  UNCHAINED_ZITADEL_DISCOVERY_URL,
  ROOT_URL = 'http://localhost:4010',
} = process.env;

interface ZitadelIdToken {
  sub: string;
  nonce?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  'urn:zitadel:iam:org:project:roles'?: Record<string, Record<string, string>>;
}

/**
 * Returns the OIDC provider configuration for Zitadel
 * This is used by the platform's JWT auth to verify back-channel logout tokens
 */
export function getZitadelOIDCConfig(): OIDCProviderConfig {
  return {
    issuer: UNCHAINED_ZITADEL_DISCOVERY_URL!,
    audience: UNCHAINED_ZITADEL_CLIENT_ID,
  };
}

/**
 * Setup Zitadel OAuth2 integration
 *
 * This simplified implementation:
 * 1. Uses @fastify/oauth2 for the authorization code flow with PKCE
 * 2. After successful callback, issues a local JWT via context.login()
 * 3. Subsequent requests are authenticated via the platform's JWT system
 * 4. Back-channel logout is handled by the platform's unified handler
 */
export default async function setupZitadel(app: FastifyInstance) {
  if (!UNCHAINED_ZITADEL_CLIENT_ID || !UNCHAINED_ZITADEL_DISCOVERY_URL)
    throw new Error(
      'Environment variables UNCHAINED_ZITADEL_CLIENT_ID and UNCHAINED_ZITADEL_DISCOVERY_URL are required',
    );

  // Fetch OIDC discovery document for JWKS URI
  const discoveryResponse = await fetch(
    `${UNCHAINED_ZITADEL_DISCOVERY_URL}/.well-known/openid-configuration`,
  );
  const discoveryData = (await discoveryResponse.json()) as {
    jwks_uri: string;
  };

  // Create remote JWKS for token verification (jose handles caching and key rotation)
  const JWKS = jose.createRemoteJWKSet(new URL(discoveryData.jwks_uri));

  // Helper function to verify ID token signature and nonce using JWKS
  const verifyIdToken = async (idToken: string, expectedNonce: string): Promise<ZitadelIdToken> => {
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: UNCHAINED_ZITADEL_DISCOVERY_URL,
      audience: UNCHAINED_ZITADEL_CLIENT_ID,
    });

    // SECURITY: Validate nonce to prevent replay attacks
    if (payload.nonce !== expectedNonce) {
      throw new Error('ID token nonce mismatch - possible replay attack');
    }

    return payload as ZitadelIdToken;
  };

  // Register OAuth2 plugin with PKCE (Zitadel uses public clients)
  // Note: @fastify/oauth2 handles state parameter automatically for CSRF protection
  // We add nonce validation separately for OIDC replay attack protection
  app.register(FastifyOAuth2, {
    name: 'zitadel',
    credentials: {
      client: {
        id: UNCHAINED_ZITADEL_CLIENT_ID,
        secret: '',
      },
    },
    // Don't use startRedirectPath - we create a custom login route for nonce handling
    scope: ['profile', 'email', 'openid'],
    pkce: 'S256',
    callbackUri: `${ROOT_URL}${UNCHAINED_ZITADEL_CALLBACK_PATH}`,
    discovery: { issuer: UNCHAINED_ZITADEL_DISCOVERY_URL },
  });

  // Custom login route with nonce generation
  app.get('/login', async function (
    this: FastifyInstance & { zitadel: FastifyOAuth2.OAuth2Namespace },
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
    const baseUri = await this.zitadel.generateAuthorizationUri(request, reply);
    const authUri = new URL(baseUri);
    authUri.searchParams.set('nonce', nonce);

    return reply.redirect(authUri.toString());
  });

  // OAuth2 callback - creates/updates user and issues local JWT
  app.get(
    UNCHAINED_ZITADEL_CALLBACK_PATH,
    async function (
      this: FastifyInstance & { zitadel: FastifyOAuth2.OAuth2Namespace },
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

        const accessToken = await this.zitadel.getAccessTokenFromAuthorizationCodeFlow(request);
        // SECURITY: Verify ID token signature and nonce
        const decoded = await verifyIdToken(accessToken.token.id_token, expectedNonce);

        const {
          sub,
          preferred_username,
          name,
          given_name,
          family_name,
          email,
          email_verified,
          'urn:zitadel:iam:org:project:roles': projectRoles,
        } = decoded;

        const roles = projectRoles ? Object.keys(projectRoles) : [];
        const userId = `${UNCHAINED_ZITADEL_CLIENT_ID}:${sub}`;

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
        logger.error('Zitadel callback error:', {
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

  // Simple context wrapper - no longer needed for session management
  // The platform's JWT system handles everything after the initial login
  return (contextResolver: UnchainedContextResolver) => contextResolver;
}
