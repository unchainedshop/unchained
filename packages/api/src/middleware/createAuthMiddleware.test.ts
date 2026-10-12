import { describe, it } from 'node:test';
import assert from 'node:assert';

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
  return setCookies[0];
};

describe('createAuthContext cookie SameSite', () => {
  it('maps UNCHAINED_COOKIE_SAMESITE=0 to no SameSite attribute', async () => {
    assert.doesNotMatch(await logoutCookieFor('0'), /SameSite/);
  });

  it('maps UNCHAINED_COOKIE_SAMESITE=1 to SameSite=Strict', async () => {
    assert.match(await logoutCookieFor('1'), /; SameSite=Strict$/);
  });

  it('keeps explicit values', async () => {
    assert.match(await logoutCookieFor('none'), /; SameSite=None$/);
    assert.match(await logoutCookieFor(' Strict '), /; SameSite=Strict$/);
  });

  it('falls back to Lax for unknown values', async () => {
    assert.match(await logoutCookieFor('sideways'), /; SameSite=Lax$/);
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
    assert.match(
      setCookies[0],
      /^unchained_token=; Path=\/; (Domain=[^;]+; )?Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly/,
    );
  });
});
