import type { User } from '@unchainedshop/core-users';
import { emit } from '@unchainedshop/events';
import {
  signAccessToken,
  createAuthHandler,
  generateFingerprint,
  verifyFingerprint,
  type AuthConfig,
} from '../auth.ts';
import type { LoginFn, LogoutFn } from '../context.ts';
import { API_EVENTS } from '../events.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:auth-middleware');

const {
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  UNCHAINED_COOKIE_SAMESITE = 'lax', // OWASP: Changed from 'none' to 'lax' for CSRF protection
  UNCHAINED_COOKIE_INSECURE,
  UNCHAINED_FINGERPRINT_COOKIE_NAME = '__Secure-fgp', // OWASP: Use __Secure- prefix
  UNCHAINED_TOKEN_EXPIRY_SECONDS = '3600', // Match auth.ts default
} = process.env;

export interface AuthContextParams {
  getHeader: (key: string) => string | undefined;
  setHeader: (key: string, value: string) => void;
  getCookie: (name: string) => string | undefined;
  setCookie: (name: string, value: string, options: CookieOptions) => void;
  clearCookie: (name: string, options: CookieOptions) => void;
  remoteAddress?: string;
  remotePort?: number;
}

export interface CookieOptions {
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none' | boolean;
  maxAge?: number;
  expires?: Date;
}

export interface AuthContext {
  userId?: string;
  tokenVersion?: number;
  impersonatorId?: string;
  accessToken?: string;
  login: LoginFn;
  logout: LogoutFn;
}

/**
 * Get cookie options for the main JWT token cookie
 */
function getTokenCookieOptions(expires?: Date): CookieOptions {
  const secure = !UNCHAINED_COOKIE_INSECURE;
  const sameSite =
    (
      {
        none: 'none',
        lax: 'lax',
        strict: 'strict',
        '1': true,
        '0': false,
      } as Record<string, boolean | 'none' | 'lax' | 'strict'>
    )[UNCHAINED_COOKIE_SAMESITE?.trim()?.toLowerCase()] || 'lax'; // Default to 'lax' for safety

  // Warn if using insecure configuration in production
  if (!secure && process.env.NODE_ENV === 'production') {
    logger.warn(
      'SECURITY WARNING: Running with UNCHAINED_COOKIE_INSECURE in production is not recommended',
    );
  }

  // Warn if using SameSite=None without Secure
  if (sameSite === 'none' && !secure) {
    logger.warn('SECURITY WARNING: SameSite=None requires Secure flag to be effective');
  }

  const expirySeconds = parseInt(UNCHAINED_TOKEN_EXPIRY_SECONDS, 10);

  return {
    domain: UNCHAINED_COOKIE_DOMAIN,
    path: UNCHAINED_COOKIE_PATH,
    secure,
    httpOnly: true, // OWASP: Always true to prevent XSS access
    sameSite: sameSite as boolean | 'none' | 'lax' | 'strict',
    maxAge: expires ? undefined : expirySeconds * 1000,
    expires,
  };
}

/**
 * Get cookie options for the fingerprint cookie (hardened)
 * OWASP: Fingerprint cookie should be HttpOnly, Secure, SameSite=Strict
 */
function getFingerprintCookieOptions(expires?: Date): CookieOptions {
  const secure = !UNCHAINED_COOKIE_INSECURE;
  const expirySeconds = parseInt(UNCHAINED_TOKEN_EXPIRY_SECONDS, 10);

  return {
    domain: UNCHAINED_COOKIE_DOMAIN,
    path: UNCHAINED_COOKIE_PATH,
    secure,
    httpOnly: true, // OWASP: Prevent JavaScript access
    sameSite: 'strict', // OWASP: Strict for fingerprint to prevent cross-site token theft
    maxAge: expires ? undefined : expirySeconds * 1000,
    expires,
  };
}

/**
 * Extract Bearer token from Authorization header
 * OWASP: Validate that the scheme is actually "Bearer" (case-insensitive per RFC 7235)
 */
function extractBearerToken(authHeader: string | undefined): string | undefined {
  if (!authHeader) return undefined;

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return undefined;

  const [scheme, token] = parts;

  // RFC 7235: Authorization scheme is case-insensitive
  if (scheme.toLowerCase() !== 'bearer') {
    logger.debug('Authorization header present but not Bearer scheme');
    return undefined;
  }

  return token;
}

/**
 * Create authentication context from request headers/cookies
 */
export async function createAuthContext(
  params: AuthContextParams,
  authConfig?: AuthConfig,
): Promise<AuthContext> {
  const { getHeader, getCookie, setCookie, clearCookie } = params;

  // Extract token from Authorization header (Bearer scheme only) or cookie
  const authHeader = getHeader('authorization');
  const headerToken = extractBearerToken(authHeader);
  const cookieToken = getCookie(UNCHAINED_COOKIE_NAME);
  const token = headerToken || cookieToken;

  // Get fingerprint cookie for sidejacking protection
  const fingerprintCookie = getCookie(UNCHAINED_FINGERPRINT_COOKIE_NAME);

  // Create auth handler with configured providers
  const verifyToken = createAuthHandler(authConfig);

  // Verify the token
  const authResult = token ? await verifyToken(token) : {};

  // OWASP: Verify fingerprint if present in token
  let fingerprintValid = true;
  if (authResult.fingerprintHash && fingerprintCookie) {
    fingerprintValid = verifyFingerprint(fingerprintCookie, authResult.fingerprintHash);
    if (!fingerprintValid) {
      logger.warn('Token sidejacking detected: fingerprint mismatch', {
        userId: authResult.userId,
      });
      // Invalidate the authentication
      authResult.userId = undefined;
      authResult.tokenVersion = undefined;
      authResult.impersonatorId = undefined;
    }
  } else if (authResult.fingerprintHash && !fingerprintCookie) {
    // Token has fingerprint but cookie is missing - potential theft
    logger.warn('Token sidejacking detected: fingerprint cookie missing', {
      userId: authResult.userId,
    });
    fingerprintValid = false;
    authResult.userId = undefined;
    authResult.tokenVersion = undefined;
    authResult.impersonatorId = undefined;
  }

  // Create login function
  const login: LoginFn = async (user: User, options = {}) => {
    const { impersonator } = options;

    // Get current token version, defaulting to 1
    const tokenVersion = user.tokenVersion ?? 1;

    // Generate fingerprint for sidejacking protection
    const { raw: fingerprintRaw, hash: fingerprintHash } = generateFingerprint();

    // Sign new JWT with fingerprint hash
    const { token: newToken, expires } = signAccessToken(user._id, tokenVersion, {
      impersonatorId: impersonator?._id,
      fingerprintHash,
    });

    // Set JWT cookie
    setCookie(UNCHAINED_COOKIE_NAME, newToken, getTokenCookieOptions(expires));

    // Set fingerprint cookie (hardened - SameSite=Strict)
    setCookie(UNCHAINED_FINGERPRINT_COOKIE_NAME, fingerprintRaw, getFingerprintCookieOptions(expires));

    const tokenObject = {
      _id: crypto.randomUUID(), // Session ID equivalent
      userId: user._id,
      tokenExpires: expires,
    };

    await emit(API_EVENTS.API_LOGIN_TOKEN_CREATED, tokenObject);

    (user as any)._inLoginMethodResponse = true;
    return { user, ...tokenObject };
  };

  // Create logout function
  // NOTE: This performs a "soft" logout - clears cookies but the JWT remains
  // cryptographically valid until expiration. For immediate revocation of all
  // tokens, use the logoutAllSessions mutation which increments tokenVersion.
  const logout: LogoutFn = async () => {
    // Clear both cookies
    clearCookie(UNCHAINED_COOKIE_NAME, getTokenCookieOptions());
    clearCookie(UNCHAINED_FINGERPRINT_COOKIE_NAME, getFingerprintCookieOptions());

    if (authResult.userId) {
      const tokenObject = {
        _id: crypto.randomUUID(),
        userId: authResult.userId,
      };
      await emit(API_EVENTS.API_LOGOUT, tokenObject);
    }

    return true;
  };

  return {
    userId: authResult.userId,
    tokenVersion: authResult.tokenVersion,
    impersonatorId: authResult.impersonatorId,
    accessToken: authResult.isApiKey ? authResult.accessToken : undefined,
    login,
    logout,
  };
}
