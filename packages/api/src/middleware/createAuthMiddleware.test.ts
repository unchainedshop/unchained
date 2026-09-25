import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { CookieOptions } from './createAuthMiddleware.ts';

// Cookie settings are read from the environment when the module loads, so every case
// imports a fresh module instance (distinct URL) after setting UNCHAINED_COOKIE_SAMESITE.
const cookieOptionsFor = async (sameSite: string) => {
  process.env.UNCHAINED_COOKIE_SAMESITE = sameSite;
  const modulePath = `./createAuthMiddleware.ts?samesite=${encodeURIComponent(sameSite)}`;
  const { createAuthContext } = await import(modulePath);

  let cleared: CookieOptions | undefined;
  const authContext = await createAuthContext({
    getHeader: () => undefined,
    setHeader: () => undefined,
    getCookie: () => undefined,
    setCookie: () => undefined,
    clearCookie: (_name: string, options: CookieOptions) => {
      cleared = options;
    },
  });
  await authContext.logout();
  return cleared!;
};

describe('createAuthContext cookie SameSite', () => {
  it('maps UNCHAINED_COOKIE_SAMESITE=0 to sameSite false', async () => {
    assert.strictEqual((await cookieOptionsFor('0')).sameSite, false);
  });

  it('maps UNCHAINED_COOKIE_SAMESITE=1 to sameSite true', async () => {
    assert.strictEqual((await cookieOptionsFor('1')).sameSite, true);
  });

  it('keeps explicit values', async () => {
    assert.strictEqual((await cookieOptionsFor('none')).sameSite, 'none');
    assert.strictEqual((await cookieOptionsFor(' Strict ')).sameSite, 'strict');
  });

  it('falls back to lax for unknown values', async () => {
    assert.strictEqual((await cookieOptionsFor('sideways')).sameSite, 'lax');
  });
});
