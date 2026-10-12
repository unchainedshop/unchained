import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseSetCookie } from 'cookie';

// Cookie settings are read from the environment when the module loads, so every case
// imports a fresh module instance (distinct URL) after setting UNCHAINED_COOKIE_SAMESITE.
const logoutCookieFor = async (sameSite: string) => {
  process.env.UNCHAINED_COOKIE_SAMESITE = sameSite;
  const modulePath = `./createAuthMiddleware.ts?samesite=${encodeURIComponent(sameSite)}`;
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
    const { createAuthContext } = await import('./createAuthMiddleware.ts?token-cookie');
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
    await assert.rejects(import('./createAuthMiddleware.ts?invalid-domain'), /option domain is invalid/);
  });

  it('decodes a percent-encoded token cookie and keeps a malformed one as sent', async () => {
    const { createAuthContext } = await import('./createAuthMiddleware.ts?token-cookie');
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
