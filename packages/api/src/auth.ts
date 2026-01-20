import { createLogger } from '@unchainedshop/logger';
import jwt from 'jsonwebtoken';
import * as jose from 'jose';
import { createHash } from 'crypto';

const logger = createLogger('unchained:api:auth');

const {
  UNCHAINED_TOKEN_SECRET,
  UNCHAINED_TOKEN_EXPIRY_SECONDS = '3600', // 1 hour default (was 7 days - OWASP recommends shorter)
  UNCHAINED_TOKEN_ISSUER = 'unchained-engine',
} = process.env;

// Minimum secret length for HS256 (256 bits = 32 bytes)
const MIN_SECRET_LENGTH = 32;

// JWKS cache using jose's createRemoteJWKSet (handles caching internally)
const jwksCache = new Map<string, jose.JWTVerifyGetKey>();

export interface AccessTokenPayload {
  iss: string; // issuer - OWASP requires this
  sub: string; // userId
  ver: number; // tokenVersion
  fgp?: string; // fingerprint hash for sidejacking protection
  imp?: string; // impersonatorId (for admin impersonation)
  jti?: string; // unique token ID
  iat?: number; // issued at
  exp?: number; // expiration
}

export interface OIDCProviderConfig {
  issuer: string;
  jwksUri?: string;
  audience?: string | string[];
}

export interface AuthConfig {
  oidcProviders?: OIDCProviderConfig[];
}

/**
 * Validate the token secret meets minimum security requirements
 * OWASP: JWT secrets must be at least 256 bits (32 bytes) for HS256
 */
function validateSecretStrength(secret: string): void {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `UNCHAINED_TOKEN_SECRET must be at least ${MIN_SECRET_LENGTH} characters (256 bits) for security. ` +
        `Current length: ${secret.length}. Generate a secure secret with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
    );
  }
}

/**
 * Generate a fingerprint hash for token sidejacking protection
 * OWASP: Store SHA256 hash in token, send raw value as hardened cookie
 */
export function generateFingerprint(): { raw: string; hash: string } {
  const raw = crypto.randomUUID() + crypto.randomUUID(); // 72 chars of randomness
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/**
 * Verify a fingerprint matches its hash
 */
export function verifyFingerprint(raw: string, hash: string): boolean {
  const computedHash = createHash('sha256').update(raw).digest('hex');
  // Use timing-safe comparison to prevent timing attacks
  if (computedHash.length !== hash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Sign a new JWT access token for local authentication
 */
export function signAccessToken(
  userId: string,
  tokenVersion: number,
  options?: {
    impersonatorId?: string;
    fingerprintHash?: string;
  },
): { token: string; expires: Date } {
  if (!UNCHAINED_TOKEN_SECRET) {
    throw new Error('UNCHAINED_TOKEN_SECRET environment variable is required');
  }

  // Validate secret strength on first use
  validateSecretStrength(UNCHAINED_TOKEN_SECRET);

  const expirySeconds = parseInt(UNCHAINED_TOKEN_EXPIRY_SECONDS, 10);
  const now = Math.floor(Date.now() / 1000);

  const payload: AccessTokenPayload = {
    iss: UNCHAINED_TOKEN_ISSUER, // OWASP: Include issuer claim
    sub: userId,
    ver: tokenVersion,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + expirySeconds,
  };

  // Add fingerprint hash for sidejacking protection
  if (options?.fingerprintHash) {
    payload.fgp = options.fingerprintHash;
  }

  if (options?.impersonatorId) {
    payload.imp = options.impersonatorId;
  }

  const token = jwt.sign(payload, UNCHAINED_TOKEN_SECRET, {
    algorithm: 'HS256',
  });

  const expires = new Date((now + expirySeconds) * 1000);

  return { token, expires };
}

/**
 * Verify a locally-issued JWT token
 */
export function verifyLocalToken(token: string): AccessTokenPayload | null {
  if (!UNCHAINED_TOKEN_SECRET) {
    logger.warn('UNCHAINED_TOKEN_SECRET not set, cannot verify local tokens');
    return null;
  }

  try {
    // Validate secret strength
    validateSecretStrength(UNCHAINED_TOKEN_SECRET);

    const decoded = jwt.verify(token, UNCHAINED_TOKEN_SECRET, {
      algorithms: ['HS256'], // OWASP: Whitelist allowed algorithms
      issuer: UNCHAINED_TOKEN_ISSUER, // OWASP: Validate issuer
    }) as AccessTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.debug('Invalid token signature or claims');
    } else {
      // SECURITY: Only log error message and type, not full object (may contain sensitive data)
      logger.error('Token verification error:', {
        message: (error as Error).message,
        name: (error as Error).name,
      });
    }
    return null;
  }
}

/**
 * Get or create a JWKS fetcher for the given URI
 * jose library handles caching and key rotation automatically
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

/**
 * Verify an OIDC provider JWT token
 * CRITICAL FIX: Actually verify the signature using jose library
 */
export async function verifyOIDCToken(
  token: string,
  providers: OIDCProviderConfig[],
): Promise<{ userId: string; roles?: string[] } | null> {
  // First, decode without verification to get the issuer
  let decodedPayload: jose.JWTPayload;

  try {
    // Decode to inspect claims (NOT verification)
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.debug('Invalid JWT format');
      return null;
    }
    // We only need the payload to find the matching provider by issuer
    decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  } catch {
    logger.debug('Failed to decode JWT');
    return null;
  }

  const { iss, sub } = decodedPayload;

  if (!iss || !sub || typeof iss !== 'string' || typeof sub !== 'string') {
    logger.debug('OIDC token missing issuer or subject');
    return null;
  }

  // Find matching provider by issuer
  const provider = providers.find((p) => p.issuer === iss);
  if (!provider) {
    logger.debug('No matching OIDC provider for issuer:', { iss });
    return null;
  }

  // Construct JWKS URI if not provided
  const jwksUri = provider.jwksUri || `${provider.issuer}/.well-known/jwks.json`;

  try {
    // Get the JWKS fetcher (cached)
    const JWKS = getJWKS(jwksUri);

    // CRITICAL: Actually verify the signature using jose
    const verifyOptions: jose.JWTVerifyOptions = {
      issuer: provider.issuer,
    };

    // Add audience validation if configured
    if (provider.audience) {
      verifyOptions.audience = provider.audience;
    }

    // This performs FULL cryptographic verification
    const { payload } = await jose.jwtVerify(token, JWKS, verifyOptions);

    logger.debug('OIDC token verified successfully', { issuer: iss, subject: sub });

    return {
      userId: payload.sub as string,
      roles: (payload as any).roles,
    };
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      logger.debug('OIDC token expired');
    } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
      logger.debug('OIDC token claim validation failed:', { message: (error as Error).message });
    } else if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      logger.debug('OIDC token signature verification failed');
    } else {
      // SECURITY: Only log error message and type, not full object (may contain sensitive data)
      logger.error('OIDC token verification failed:', {
        message: (error as Error).message,
        name: (error as Error).name,
      });
    }
    return null;
  }
}

export interface AuthHandlerResult {
  userId?: string;
  tokenVersion?: number;
  impersonatorId?: string;
  fingerprintHash?: string;
  accessToken?: string;
  isApiKey?: boolean;
}

/**
 * Create an auth handler that verifies tokens using the configured auth methods
 */
export function createAuthHandler(config?: AuthConfig) {
  return async function verifyToken(token: string): Promise<AuthHandlerResult> {
    if (!token) {
      return {};
    }

    // First, try local JWT verification (fast path)
    const localPayload = verifyLocalToken(token);
    if (localPayload) {
      return {
        userId: localPayload.sub,
        tokenVersion: localPayload.ver,
        impersonatorId: localPayload.imp,
        fingerprintHash: localPayload.fgp,
      };
    }

    // Second, try OIDC provider verification if configured
    if (config?.oidcProviders?.length) {
      const oidcResult = await verifyOIDCToken(token, config.oidcProviders);
      if (oidcResult) {
        return {
          userId: oidcResult.userId,
          // OIDC tokens don't have token version, so we skip that check
        };
      }
    }

    // If not a valid JWT, pass through as potential API key
    // The context resolver will try to look it up in the database
    return {
      accessToken: token,
      isApiKey: true,
    };
  };
}
