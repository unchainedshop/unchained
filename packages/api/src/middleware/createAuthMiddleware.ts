import type { User } from '@unchainedshop/core-users';
import { emit } from '@unchainedshop/events';
import { signAccessToken, createAuthHandler, type AuthConfig } from '../auth.ts';
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
} = process.env;

export interface AuthContextParams {
  getHeader: (name: string) => string | undefined;
  /** Adds a response header field, also when one of the same name exists (Set-Cookie) */
  appendHeader: (name: string, value: string) => void;
  remoteAddress?: string;
}

export interface AuthContext {
  userId?: string;
  tokenVersion?: number;
  impersonatorId?: string;
  accessToken?: string;
  login: LoginFn;
  logout: LogoutFn;
}

const secure = !UNCHAINED_COOKIE_INSECURE;
const sameSite =
  (
    {
      none: 'None',
      lax: 'Lax',
      strict: 'Strict',
      '1': 'Strict',
      '0': false,
    } as Record<string, string | false>
  )[UNCHAINED_COOKIE_SAMESITE.trim().toLowerCase()] ?? 'Lax'; // Unknown values default to Lax; '0' must stay without SameSite

if (!secure && process.env.NODE_ENV === 'production') {
  logger.warn(
    'SECURITY WARNING: Running with UNCHAINED_COOKIE_INSECURE in production is not recommended',
  );
}
if (sameSite === 'None' && !secure) {
  logger.warn('SECURITY WARNING: SameSite=None requires Secure flag to be effective');
}

/** Set-Cookie value of the JWT token cookie, an expiry in the past deletes it */
const tokenCookie = (token: string, expires: Date) =>
  [
    `${UNCHAINED_COOKIE_NAME}=${token}`,
    `Path=${UNCHAINED_COOKIE_PATH}`,
    UNCHAINED_COOKIE_DOMAIN && `Domain=${UNCHAINED_COOKIE_DOMAIN}`,
    `Expires=${expires.toUTCString()}`,
    'HttpOnly', // OWASP: Always true to prevent XSS access
    secure && 'Secure',
    sameSite && `SameSite=${sameSite}`,
  ]
    .filter(Boolean)
    .join('; ');

const readCookie = (cookieHeader: string | undefined, name: string) => {
  for (const pair of cookieHeader?.split(';') ?? []) {
    const separator = pair.indexOf('=');
    if (separator > 0 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return undefined;
};

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
  const { getHeader, appendHeader } = params;

  // Extract token from Authorization header (Bearer scheme only) or cookie
  const authHeader = getHeader('authorization');
  const headerToken = extractBearerToken(authHeader);
  const cookieToken = readCookie(getHeader('cookie'), UNCHAINED_COOKIE_NAME);
  const token = headerToken || cookieToken;

  // Create auth handler with configured providers
  const verifyToken = createAuthHandler(authConfig);

  // Verify the token
  const authResult = token ? await verifyToken(token) : {};

  // Create login function
  const login: LoginFn = async (user: User, options = {}) => {
    const { impersonator } = options;

    // Get current token version; a missing field is 0 (never revoked)
    const tokenVersion = user.tokenVersion ?? 0;

    const { token: newToken, expires } = await signAccessToken(user._id, tokenVersion, {
      impersonatorId: impersonator?._id,
    });

    // Set JWT cookie
    appendHeader('set-cookie', tokenCookie(newToken, expires));

    const tokenObject = {
      _id: crypto.randomUUID(), // Session ID equivalent
      userId: user._id,
      userName: user.username || user.emails?.[0]?.address,
      tokenExpires: expires,
      remoteAddress: params.remoteAddress,
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
    appendHeader('set-cookie', tokenCookie('', new Date(0)));

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
