import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseSetCookie } from 'cookie';
import * as jose from 'jose';
import { registerEvents } from '@unchainedshop/events';
import { API_EVENTS } from '../events.ts';

// auth.ts reads the secret when it first loads, before the login cases below sign tokens.
// npm test sets it through .env.tests.
process.env.UNCHAINED_TOKEN_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
registerEvents(Object.keys(API_EVENTS));

// Cookie settings are read from the environment when the module loads, so every case
// imports a fresh module instance (distinct URL) after setting UNCHAINED_COOKIE_SAMESITE.
const logoutCookieFor = async (sameSite: string) => {
  process.env.UNCHAINED_COOKIE_SAMESITE = sameSite;
  const modulePath = `./createAuthContext.ts?samesite=${encodeURIComponent(sameSite)}`;
  const { createAuthContext } = await import(modulePath);

  const setCookies: string[] = [];
  const authContext = await createAuthContext({
    getHeader: () => undefined,
    appendHeader: (name: string, value: string) => {
      if (name === 'set-cookie') setCookies.push(value);
    },
  });
  await authContext.logout();
  return parseSetCookie(setCookies[0]);
};

describe('createAuthContext cookie SameSite', () => {
  it('maps UNCHAINED_COOKIE_SAMESITE=0 to no SameSite attribute', async () => {
    assert.strictEqual((await logoutCookieFor('0')).sameSite, undefined);
  });

  it('maps UNCHAINED_COOKIE_SAMESITE=1 to SameSite=Strict', async () => {
    assert.strictEqual((await logoutCookieFor('1')).sameSite, 'strict');
  });

  it('keeps explicit values', async () => {
    assert.strictEqual((await logoutCookieFor('none')).sameSite, 'none');
    assert.strictEqual((await logoutCookieFor(' Strict ')).sameSite, 'strict');
  });

  it('falls back to Lax for unknown values', async () => {
    assert.strictEqual((await logoutCookieFor('sideways')).sameSite, 'lax');
  });
});

describe('createAuthContext token cookie', () => {
  it('reads the token cookie and deletes it on logout', async () => {
    const { createAuthContext } = await import('./createAuthContext.ts?token-cookie');
    const setCookies: string[] = [];
    const headers: Record<string, string> = { cookie: 'other=1; unchained_token=not-a-jwt; last=2' };
    const authContext = await createAuthContext({
      getHeader: (name: string) => headers[name],
      appendHeader: (_name: string, value: string) => setCookies.push(value),
    });
    // Not a JWT: the cookie value is handed on as a potential API key
    assert.strictEqual(authContext.accessToken, 'not-a-jwt');
    assert.strictEqual(authContext.userId, undefined);
    await authContext.logout();
    // Domain, Secure and SameSite depend on the environment
    assert.strictEqual(setCookies.length, 1);
    const { name, value, path, expires, httpOnly } = parseSetCookie(setCookies[0]);
    assert.deepStrictEqual(
      { name, value, path, expires, httpOnly },
      { name: 'unchained_token', value: '', path: '/', expires: new Date(0), httpOnly: true },
    );
  });

  it('refuses invalid cookie settings when it loads', async (t) => {
    const { UNCHAINED_COOKIE_DOMAIN } = process.env;
    t.after(() => {
      if (UNCHAINED_COOKIE_DOMAIN === undefined) delete process.env.UNCHAINED_COOKIE_DOMAIN;
      else process.env.UNCHAINED_COOKIE_DOMAIN = UNCHAINED_COOKIE_DOMAIN;
    });
    process.env.UNCHAINED_COOKIE_DOMAIN = 'shop.test; SameSite=None';
    await assert.rejects(import('./createAuthContext.ts?invalid-domain'), /domain is invalid/);
  });

  it('decodes a percent-encoded token cookie and keeps a malformed one as sent', async () => {
    const { createAuthContext } = await import('./createAuthContext.ts?token-cookie');
    const accessTokenOf = async (cookie: string) =>
      (
        await createAuthContext({
          getHeader: (name: string) => (name === 'cookie' ? cookie : undefined),
          appendHeader: () => undefined,
        })
      ).accessToken;
    assert.strictEqual(
      await accessTokenOf('unchained_token=custom%2Bkey%2Fwith%3Dpadding'),
      'custom+key/with=padding',
    );
    assert.strictEqual(await accessTokenOf('unchained_token=bad%zz'), 'bad%zz');
  });
});

describe('createAuthContext login', () => {
  const loginCookieFor = async (options?: { expiresIn?: number }) => {
    const { createAuthContext } = await import('./createAuthContext.ts?token-cookie');
    const setCookies: string[] = [];
    const { login } = await createAuthContext({
      getHeader: () => undefined,
      appendHeader: (_name: string, value: string) => setCookies.push(value),
    });
    const { tokenExpires } = await login({ _id: 'user-id', username: 'user' }, options);
    const { value, expires } = parseSetCookie(setCookies[0]);
    const { iat, exp } = jose.decodeJwt(value);
    return { tokenExpires, expires, lifetime: exp! - iat!, exp };
  };

  it('signs a session of expiresIn seconds and lets the cookie expire with it', async () => {
    const { tokenExpires, expires, lifetime, exp } = await loginCookieFor({ expiresIn: 43200 });
    assert.strictEqual(lifetime, 43200);
    assert.strictEqual(tokenExpires.getTime(), exp! * 1000);
    assert.deepStrictEqual(expires, tokenExpires);
  });

  it('keeps UNCHAINED_TOKEN_EXPIRY_SECONDS without expiresIn', async () => {
    const { tokenExpires, expires, lifetime } = await loginCookieFor();
    assert.strictEqual(lifetime, Number(process.env.UNCHAINED_TOKEN_EXPIRY_SECONDS || 3600));
    assert.deepStrictEqual(expires, tokenExpires);
  });
});
