import * as jose from 'jose';
import { createLogger } from '@unchainedshop/logger';
import type { PluginHttpRoute } from '@unchainedshop/core';
import type { OIDCProviderConfig } from '../auth.ts';

const logger = createLogger('unchained:api:backchannel-logout');

/**
 * Normalize an issuer URL for consistent comparison
 * Handles trailing slash differences between provider configurations and JWT claims
 */
function normalizeIssuer(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash for consistent comparison
    return parsed.origin + parsed.pathname.replace(/\/$/, '');
  } catch {
    return url;
  }
}

// JWKS cache using jose's createRemoteJWKSet (handles caching internally)
const jwksCache = new Map<string, jose.JWTVerifyGetKey>();

/**
 * Get or create a JWKS fetcher for the given URI
 */
function getJWKS(jwksUri: string): jose.JWTVerifyGetKey {
  let jwks = jwksCache.get(jwksUri);
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(jwksUri), {
      cooldownDuration: 30000, // 30 seconds between refresh attempts
      cacheMaxAge: 600000, // Cache for 10 minutes
    });
    jwksCache.set(jwksUri, jwks);
  }
  return jwks;
}

interface BackchannelLogoutTokenPayload extends jose.JWTPayload {
  events?: {
    'http://schemas.openid.net/event/backchannel-logout'?: Record<string, never>;
  };
  sid?: string; // Session ID (optional)
}

/**
 * Creates a PluginHttpRoute for back-channel logout
 * Works with the unified route mounting infrastructure
 *
 * This endpoint receives logout tokens from OIDC providers when a user logs out
 * from the identity provider. It increments the user's tokenVersion to invalidate
 * all existing JWT tokens.
 *
 * SECURITY: This handler verifies the logout token signature using the provider's JWKS
 * to prevent attackers from forging logout tokens.
 *
 * @see https://openid.net/specs/openid-connect-backchannel-1_0.html
 */
export function createBackchannelLogoutRoute(providers: OIDCProviderConfig[]): PluginHttpRoute {
  return {
    path: '/backchannel-logout',
    method: 'ALL',
    handler: async (request: Request, context) => {
      // Only accept POST requests
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        // Parse form-urlencoded body (OIDC back-channel logout uses this format)
        let logoutToken: string | null = null;

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          logoutToken = formData.get('logout_token') as string;
        } else if (contentType.includes('application/json')) {
          // Some providers might send JSON
          const body = (await request.json()) as { logout_token?: string };
          logoutToken = body.logout_token || null;
        }

        if (!logoutToken) {
          logger.warn('Back-channel logout request missing logout_token');
          return new Response(JSON.stringify({ error: 'missing_logout_token' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // First, decode without verification to identify the issuer
        // This is safe because we verify the signature below
        let decodedPayload: jose.JWTPayload;
        try {
          const parts = logoutToken.split('.');
          if (parts.length !== 3) {
            logger.warn('Invalid logout token format: not a valid JWT');
            return new Response(JSON.stringify({ error: 'invalid_token' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        } catch {
          logger.warn('Failed to decode logout token');
          return new Response(JSON.stringify({ error: 'invalid_token' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const { iss } = decodedPayload;

        if (!iss || typeof iss !== 'string') {
          logger.warn('Logout token missing issuer (iss)');
          return new Response(JSON.stringify({ error: 'invalid_token' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Find matching provider by issuer (with URL normalization for trailing slash differences)
        const normalizedIss = normalizeIssuer(iss);
        const provider = providers.find((p) => normalizeIssuer(p.issuer) === normalizedIss);
        if (!provider) {
          logger.warn('Unknown issuer in logout token:', { iss });
          return new Response(JSON.stringify({ error: 'unknown_issuer' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Construct JWKS URI if not provided
        const jwksUri = provider.jwksUri || `${provider.issuer}/.well-known/jwks.json`;

        // CRITICAL: Verify the logout token signature using the provider's JWKS
        let verifiedPayload: BackchannelLogoutTokenPayload;
        try {
          const JWKS = getJWKS(jwksUri);

          const verifyOptions: jose.JWTVerifyOptions = {
            issuer: provider.issuer,
          };

          // Add audience validation if configured
          if (provider.audience) {
            verifyOptions.audience = provider.audience;
          }

          // Perform FULL cryptographic verification
          const { payload } = await jose.jwtVerify(logoutToken, JWKS, verifyOptions);
          verifiedPayload = payload as BackchannelLogoutTokenPayload;
        } catch (error) {
          if (error instanceof jose.errors.JWTExpired) {
            logger.warn('Logout token expired');
            return new Response(JSON.stringify({ error: 'token_expired' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
            logger.warn('Logout token claim validation failed:', { message: (error as Error).message });
            return new Response(JSON.stringify({ error: 'invalid_claims' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          } else if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
            logger.warn('Logout token signature verification failed - possible forgery attempt');
            return new Response(JSON.stringify({ error: 'invalid_signature' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          } else {
            logger.error('Logout token verification failed:', { error });
            return new Response(JSON.stringify({ error: 'verification_failed' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }

        const { sub, events } = verifiedPayload;

        // Validate it's a back-channel logout token (has the required event claim)
        if (!events?.['http://schemas.openid.net/event/backchannel-logout']) {
          logger.warn('Token is not a back-channel logout token (missing events claim)');
          return new Response(JSON.stringify({ error: 'invalid_token_type' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (!sub) {
          logger.warn('Logout token missing subject (sub)');
          return new Response(JSON.stringify({ error: 'missing_subject' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Find the user by their OIDC subject ID
        // The sub claim from the OIDC provider should match the user's ID
        // or be stored in the user's profile
        const user = await context.modules.users.findUserById(sub);

        if (!user) {
          // User not found - this is not an error, just log and return success
          // The OIDC spec says we should return 200 even if we don't have the user
          logger.info('User not found for back-channel logout:', { sub });
          return new Response('', { status: 200 });
        }

        // Update the user's oidcLogoutAt and increment tokenVersion
        await context.modules.users.updateOidcLogoutAt(user._id, new Date());

        logger.info('Back-channel logout processed successfully:', {
          userId: user._id,
          issuer: iss,
        });

        // Return 200 OK as per OIDC spec
        return new Response('', { status: 200 });
      } catch (error) {
        logger.error('Back-channel logout error:', { error });
        return new Response(JSON.stringify({ error: 'internal_error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    },
  };
}

export default createBackchannelLogoutRoute;
