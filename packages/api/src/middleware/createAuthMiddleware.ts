/**
 * Shared authentication middleware for Express and Fastify
 *
 * Handles both local JWTs and external OIDC provider tokens.
 * Token version validation happens in context resolver after user lookup.
 */

import { emit } from '@unchainedshop/events';
import type { User } from '@unchainedshop/core-users';
import { type LoginFn, type LogoutFn, type LoginResult } from '../context.ts';
import { API_EVENTS } from '../events.ts';
import { signAccessToken, verifyLocalToken, createAuthHandler, type OIDCProvider } from '../auth.ts';

export interface CookieConfig {
  name: string;
  path: string;
  domain?: string;
  secure: boolean;
  sameSite: boolean | 'none' | 'lax' | 'strict';
}

export interface AuthMiddlewareConfig {
  cookie: CookieConfig;
  oidcProviders?: OIDCProvider[];
  autoCreateOIDCUsers?: boolean;
}

const {
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  // Changed default from 'none' to 'lax' for CSRF protection
  UNCHAINED_COOKIE_SAMESITE = 'lax',
  UNCHAINED_COOKIE_INSECURE,
} = process.env;

export const defaultCookieConfig: CookieConfig = {
  name: UNCHAINED_COOKIE_NAME,
  path: UNCHAINED_COOKIE_PATH,
  domain: UNCHAINED_COOKIE_DOMAIN,
  secure: !UNCHAINED_COOKIE_INSECURE,
  sameSite: ({
    none: 'none',
    lax: 'lax',
    strict: 'strict',
    '1': true,
    '0': false,
  }[UNCHAINED_COOKIE_SAMESITE?.trim()?.toLowerCase()] || false) as CookieConfig['sameSite'],
};

export interface AuthContext {
  userId?: string;
  impersonatorId?: string;
  tokenVersion?: number;
  accessToken?: string; // Raw token for API key auth (when JWT verification fails)
  login: LoginFn;
  logout: LogoutFn;
}

// Cached auth handler per config
let cachedAuthHandler: ReturnType<typeof createAuthHandler> | null = null;
let cachedOidcProviders: OIDCProvider[] | undefined;

function getAuthHandler(oidcProviders?: OIDCProvider[]) {
  // Reuse handler if providers haven't changed
  if (cachedAuthHandler && cachedOidcProviders === oidcProviders) {
    return cachedAuthHandler;
  }
  cachedOidcProviders = oidcProviders;
  cachedAuthHandler = createAuthHandler({ oidcProviders });
  return cachedAuthHandler;
}

/**
 * Create the authentication context for a request.
 */
export async function createAuthContext(params: {
  getHeader: (key: string) => string | undefined;
  setHeader: (key: string, value: string) => void;
  getCookie: (name: string) => string | undefined;
  setCookie: (name: string, value: string, options: any) => void;
  clearCookie: (name: string, options: any) => void;
  remoteAddress?: string;
  remotePort?: number;
  config: AuthMiddlewareConfig;
}): Promise<AuthContext> {
  const { getHeader, getCookie, setCookie, clearCookie, config } = params;
  const { cookie, oidcProviders } = config;

  // Extract token from header or cookie
  const authHeader = getHeader('authorization');
  const cookieToken = getCookie(cookie.name);
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  let userId: string | undefined;
  let impersonatorId: string | undefined;
  let tokenVersion: number | undefined;
  let accessToken: string | undefined;

  if (token) {
    // Try local token first (fast path)
    const localPayload = verifyLocalToken(token);
    if (localPayload) {
      userId = localPayload.sub;
      impersonatorId = localPayload.imp;
      tokenVersion = localPayload.ver;
    } else if (oidcProviders?.length) {
      // Try OIDC providers
      const authHandler = getAuthHandler(oidcProviders);
      const result = await authHandler.verifyToken(token);
      if (result) {
        userId = result.userId;
        impersonatorId = result.impersonatorId;
        tokenVersion = result.tokenVersion;
      } else {
        // Not a valid JWT - pass as accessToken for API key lookup
        accessToken = token;
      }
    } else {
      // Not a valid local JWT and no OIDC providers - pass as accessToken for API key lookup
      accessToken = token;
    }
  }

  // Login function - issues new token and sets cookie
  const login: LoginFn = async (user: User, options = {}) => {
    const { impersonator } = options;

    const { token: accessToken, expires } = signAccessToken(
      user._id,
      user.tokenVersion ?? 1,
      impersonator?._id,
    );

    setCookie(cookie.name, accessToken, {
      httpOnly: true,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      domain: cookie.domain,
      path: cookie.path,
      expires,
    });

    const result: LoginResult = { _id: accessToken, tokenExpires: expires };
    await emit(API_EVENTS.API_LOGIN_TOKEN_CREATED, {
      _id: accessToken,
      userId: user._id,
      tokenExpires: expires,
    });

    (user as any)._inLoginMethodResponse = true;
    return { user, ...result };
  };

  // Logout function - clears cookie
  const logout: LogoutFn = async () => {
    if (!userId) return false;
    clearCookie(cookie.name, { domain: cookie.domain, path: cookie.path });
    await emit(API_EVENTS.API_LOGOUT, { userId });
    return true;
  };

  return { userId, impersonatorId, tokenVersion, accessToken, login, logout };
}
