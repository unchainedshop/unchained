import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('Impersonation', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.impersonate for admin user', () => {
    test('should allow admin to impersonate another user', async () => {
      const {
        data: { impersonate },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation Impersonate($userId: ID!) {
            impersonate(userId: $userId) {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
        variables: {
          userId: 'user',
        },
      });

      assert.ok(impersonate);
      assert.strictEqual(impersonate.user._id, 'user');
      assert.strictEqual(impersonate.user.username, 'user');
    });

    test('should return error when impersonating non-existing user', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation Impersonate($userId: ID!) {
            impersonate(userId: $userId) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          userId: 'non-existing-user',
        },
      });

      assert.ok(errors);
      assert.ok(errors.length > 0);
    });
  });

  test.describe('Mutation.impersonate for normal user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation Impersonate($userId: ID!) {
            impersonate(userId: $userId) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          userId: 'admin',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.impersonate for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation Impersonate($userId: ID!) {
            impersonate(userId: $userId) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          userId: 'user',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.stopImpersonation', () => {
    test('should return to original user after stopping impersonation', async () => {
      const result = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation Impersonate($userId: ID!) {
            impersonate(userId: $userId) {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
        variables: {
          userId: 'user',
        },
      });

      const { impersonate } = result.data;
      assert.ok(impersonate);
      assert.strictEqual(impersonate.user._id, 'user');

      const setCookieHeader = result.headers.get('set-cookie');
      assert.ok(setCookieHeader, 'Set-Cookie header should be present');

      // Extract JWT token cookie
      const tokenMatch = setCookieHeader.match(/unchained_token=([^;,]+)/);
      assert.ok(tokenMatch, 'Cookie should contain unchained_token');
      const sessionCookie = tokenMatch[1];

      // Extract fingerprint cookie (required for JWT authentication)
      // The cookie name may be __Secure-fgp or just fgp depending on secure mode
      const fingerprintMatch = setCookieHeader.match(/(?:__Secure-)?fgp=([^;,]+)/);
      const fingerprintCookie = fingerprintMatch ? fingerprintMatch[1] : null;

      const graphqlFetchAsImpersonated = createLoggedInGraphqlFetch(null);

      // Build cookie string with both required cookies
      let cookieString = `unchained_token=${sessionCookie}`;
      if (fingerprintCookie) {
        cookieString += `; __Secure-fgp=${fingerprintCookie}`;
      }

      const {
        data: { stopImpersonation },
      } = await graphqlFetchAsImpersonated({
        query: /* GraphQL */ `
          mutation StopImpersonation {
            stopImpersonation {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
        headers: {
          cookie: cookieString,
        },
      });

      assert.ok(stopImpersonation);
      assert.strictEqual(stopImpersonation.user._id, 'admin');
      assert.strictEqual(stopImpersonation.user.username, 'admin');
    });

    test('should return null when not impersonating', async () => {
      const {
        data: { stopImpersonation },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation StopImpersonation {
            stopImpersonation {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
      });

      assert.strictEqual(stopImpersonation, null);
    });

    test('should return null for normal user not impersonating', async () => {
      const {
        data: { stopImpersonation },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation StopImpersonation {
            stopImpersonation {
              _id
              user {
                _id
              }
            }
          }
        `,
      });

      assert.strictEqual(stopImpersonation, null);
    });
  });
});
