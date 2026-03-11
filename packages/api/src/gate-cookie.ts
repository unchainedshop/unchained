import type { CookieOptions } from './context.ts';

const {
  UNCHAINED_GATE_COOKIE_NAME = 'unchained_gate_passcode',
  UNCHAINED_GATE_COOKIE_MAX_AGE_SECONDS = '86400', // 24 hours
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  UNCHAINED_COOKIE_SAMESITE = 'lax',
  UNCHAINED_COOKIE_INSECURE,
} = process.env;

export const GATE_COOKIE_NAME = UNCHAINED_GATE_COOKIE_NAME;
export const GATE_COOKIE_MAX_AGE = parseInt(UNCHAINED_GATE_COOKIE_MAX_AGE_SECONDS, 10) * 1000;

const resolveSameSite = (): CookieOptions['sameSite'] =>
  (
    ({
      none: 'none',
      lax: 'lax',
      strict: 'strict',
    }) as Record<string, 'none' | 'lax' | 'strict'>
  )[UNCHAINED_COOKIE_SAMESITE?.trim()?.toLowerCase()] || 'lax';

export function getGateCookieOptions(maxAge?: number): CookieOptions {
  return {
    domain: UNCHAINED_COOKIE_DOMAIN,
    path: UNCHAINED_COOKIE_PATH,
    secure: !UNCHAINED_COOKIE_INSECURE,
    httpOnly: true,
    sameSite: resolveSameSite(),
    maxAge,
  };
}
