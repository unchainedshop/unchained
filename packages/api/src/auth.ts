/**
 * Unified Authentication Module
 *
 * Handles JWT verification and user resolution for all auth methods:
 * - Local JWTs (issued by this server)
 * - External OIDC JWTs (from configured providers)
 *
 * Token version checking ensures instant revocation via logoutAllSessions.
 */

import jwt, { type JwtPayload, type JwtHeader } from 'jsonwebtoken';
import { createLogger } from '@unchainedshop/logger';
import type { User } from '@unchainedshop/core-users';

const logger = createLogger('unchained:auth');

// Default expiry: 7 days
const DEFAULT_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_JWKS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const { UNCHAINED_TOKEN_SECRET, UNCHAINED_TOKEN_EXPIRY_SECONDS } = process.env;

/** Access token payload for locally-issued JWTs */
export interface AccessTokenPayload {
  sub: string; // userId
  ver: number; // token version
  imp?: string; // impersonatorId
  jti?: string; // unique token ID
  iat?: number;
  exp?: number;
}

/** OIDC provider configuration */
export interface OIDCProvider {
  name: string;
  issuer: string;
  audience: string;
  jwksUri?: string;
  rolesPath?: string[];
  roleMapping?: Record<string, string>;
}

/** Verification result from any auth method */
export interface AuthResult {
  userId: string;
  tokenVersion?: number;
  impersonatorId?: string;
  provider?: OIDCProvider;
  oidcPayload?: JwtPayload;
}

// JWKS cache
const jwksCache = new Map<string, { keys: any[]; fetchedAt: number }>();

/** Get configured token expiry in seconds */
export function getTokenExpirySeconds(): number {
  const envExpiry = parseInt(UNCHAINED_TOKEN_EXPIRY_SECONDS || '', 10);
  return envExpiry > 0 ? envExpiry : DEFAULT_TOKEN_EXPIRY_SECONDS;
}

/** Sign a local access token */
export function signAccessToken(
  userId: string,
  tokenVersion: number,
  impersonatorId?: string,
): { token: string; expires: Date } {
  if (!UNCHAINED_TOKEN_SECRET) {
    throw new Error('UNCHAINED_TOKEN_SECRET is required');
  }

  const expiresIn = getTokenExpirySeconds();
  const payload: AccessTokenPayload = {
    sub: userId,
    ver: tokenVersion,
    jti: crypto.randomUUID(),
    ...(impersonatorId && { imp: impersonatorId }),
  };

  const token = jwt.sign(payload, UNCHAINED_TOKEN_SECRET, { expiresIn });
  return { token, expires: new Date(Date.now() + expiresIn * 1000) };
}

/** Verify a local access token (does NOT check token version - caller must do that) */
export function verifyLocalToken(token: string): AccessTokenPayload | null {
  if (!UNCHAINED_TOKEN_SECRET) return null;
  try {
    return jwt.verify(token, UNCHAINED_TOKEN_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

/** Fetch JWKS from OIDC provider with caching */
async function fetchJWKS(issuer: string, jwksUri?: string): Promise<any[]> {
  const cached = jwksCache.get(issuer);
  if (cached && Date.now() - cached.fetchedAt < DEFAULT_JWKS_CACHE_TTL) {
    return cached.keys;
  }

  const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
  const discovery = await fetch(discoveryUrl).then((r) => r.json());
  const jwksUrl = jwksUri || discovery.jwks_uri;
  const jwks = await fetch(jwksUrl).then((r) => r.json());

  jwksCache.set(issuer, { keys: jwks.keys, fetchedAt: Date.now() });
  return jwks.keys;
}

/** Convert JWK to PEM format */
function jwkToPem(key: any): string | null {
  if (key.x5c?.[0]) {
    return `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
  }
  // TODO: Handle raw RSA keys (n, e) for providers like Auth0
  return null;
}

/** Verify an OIDC token against configured providers */
async function verifyOIDCToken(
  token: string,
  providers: OIDCProvider[],
): Promise<{ provider: OIDCProvider; payload: JwtPayload } | null> {
  // Decode without verification to route to correct provider
  const decoded = jwt.decode(token, { complete: true }) as {
    header: JwtHeader;
    payload: JwtPayload;
  } | null;
  if (!decoded) return null;

  const { header, payload } = decoded;
  const provider = providers.find((p) => p.issuer === payload.iss);
  if (!provider) return null;

  // Verify audience before expensive JWKS fetch
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(provider.audience)) {
    logger.debug(`Audience mismatch for ${provider.name}`);
    return null;
  }

  try {
    const keys = await fetchJWKS(provider.issuer, provider.jwksUri);
    const key = header.kid ? keys.find((k) => k.kid === header.kid) : keys.find((k) => k.kty === 'RSA');
    const pem = key && jwkToPem(key);

    if (!pem) {
      logger.debug(`No signing key for ${provider.name}`);
      return null;
    }

    const verified = jwt.verify(token, pem, {
      issuer: provider.issuer,
      audience: provider.audience,
    }) as JwtPayload;

    return { provider, payload: verified };
  } catch (error) {
    logger.debug(`OIDC verification failed for ${provider.name}:`, error);
    return null;
  }
}

/** Extract roles from OIDC token using configured path */
function extractRoles(provider: OIDCProvider, payload: JwtPayload): string[] {
  if (!provider.rolesPath?.length) return [];

  let value: any = payload;
  for (const key of provider.rolesPath) {
    value = value?.[key];
  }

  if (!Array.isArray(value)) return [];
  return provider.roleMapping ? value.map((r) => provider.roleMapping![r] || r) : value;
}

/**
 * Create an auth handler for verifying tokens and resolving users
 */
export function createAuthHandler(options: { oidcProviders?: OIDCProvider[] } = {}) {
  const { oidcProviders = [] } = options;

  // Pre-warm JWKS cache
  for (const provider of oidcProviders) {
    fetchJWKS(provider.issuer, provider.jwksUri).catch(() => {
      logger.warn(`Failed to pre-fetch JWKS for ${provider.name}`);
    });
  }

  return {
    /**
     * Verify a bearer token and return auth info
     * Does NOT resolve the user - caller must do that and check token version
     */
    async verifyToken(token: string): Promise<AuthResult | null> {
      // Try local token first
      const local = verifyLocalToken(token);
      if (local) {
        return {
          userId: local.sub,
          tokenVersion: local.ver,
          impersonatorId: local.imp,
        };
      }

      // Try OIDC providers
      if (oidcProviders.length > 0) {
        const oidc = await verifyOIDCToken(token, oidcProviders);
        if (oidc) {
          return {
            userId: `${oidc.provider.name}:${oidc.payload.sub}`,
            provider: oidc.provider,
            oidcPayload: oidc.payload,
          };
        }
      }

      return null;
    },

    /**
     * Resolve user from auth result, optionally auto-creating OIDC users
     */
    async resolveUser(
      authResult: AuthResult,
      modules: { users: any },
      options: { autoCreateOIDCUsers?: boolean } = {},
    ): Promise<{ user: User | null; roles?: string[] }> {
      const { autoCreateOIDCUsers = true } = options;

      let user = await modules.users.findUserById(authResult.userId);

      // For local tokens, verify token version
      if (authResult.tokenVersion !== undefined && user) {
        if (user.tokenVersion !== authResult.tokenVersion) {
          logger.debug(`Token version mismatch for user ${user._id}`);
          return { user: null };
        }
      }

      // For OIDC tokens, optionally create user
      if (!user && authResult.provider && authResult.oidcPayload && autoCreateOIDCUsers) {
        const payload = authResult.oidcPayload;
        const roles = extractRoles(authResult.provider, payload);

        const createdId = await modules.users.createUser(
          {
            _id: authResult.userId,
            username: (payload.preferred_username as string) || (payload.sub as string),
            password: null,
            email: payload.email_verified ? (payload.email as string) : undefined,
            profile: {
              displayName: payload.name as string,
              address: {
                firstName: payload.given_name as string,
                lastName: payload.family_name as string,
              },
            },
            roles,
          },
          { skipMessaging: true, skipPasswordEnrollment: true },
        );

        user = await modules.users.findUserById(createdId);
        if (user) {
          logger.info(`Created OIDC user ${createdId} from ${authResult.provider.name}`);
          return { user, roles };
        }
      }

      // For OIDC users, sync roles if changed
      if (user && authResult.provider && authResult.oidcPayload) {
        const roles = extractRoles(authResult.provider, authResult.oidcPayload);
        if (roles.length && user.roles?.join(':') !== roles.join(':')) {
          user = (await modules.users.updateRoles(user._id, roles)) || user;
        }
        return { user, roles };
      }

      return { user };
    },
  };
}

// Re-export for backward compatibility
export { signAccessToken as signJWT };
export { verifyLocalToken as verifyAccessToken, verifyLocalToken as verifyJWT };
